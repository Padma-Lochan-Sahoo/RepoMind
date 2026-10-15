package repoMind.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import repoMind.backend.dto.ChatMessageResponse;
import repoMind.backend.dto.ChatSessionResponse;
import repoMind.backend.dto.CreateChatSessionRequest;
import repoMind.backend.entity.*;
import repoMind.backend.exceptions.BadRequestException;
import repoMind.backend.exceptions.NotFoundException;
import repoMind.backend.repository.ChatMessageRepository;
import repoMind.backend.repository.ChatSessionRepository;
import repoMind.backend.service.ai.ChatPromptBuilder;
import repoMind.backend.service.ai.ChatStreamHandler;
import repoMind.backend.service.ai.CitationMapper;
import repoMind.backend.service.ai.CodeContextRetriever;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final int MAX_MESSAGE_CHARS = 4_000;
    private static final int HISTORY_MESSAGES = 6;
    private static final int HISTORY_CHARS_PER_MESSAGE = 1_200;
    private static final int TITLE_MAX_CHARS = 60;

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final RepoService repoService;
    private final CodeContextRetriever codeContextRetriever;
    private final ChatPromptBuilder chatPromptBuilder;
    private final ChatStreamHandler chatStreamHandler;
    private final CitationMapper citationMapper;

    @Transactional
    public ChatSessionResponse createSession(
            UUID userId,
            CreateChatSessionRequest request) {

        Repository repo = repoService.requiredOwned(
                request.repositoryId(),
                userId
        );

        if (repo.getIndexStatus() != IndexStatus.READY) {
            throw new BadRequestException(
                    "Repository must be indexed before chatting"
            );
        }

        String title = request.title() != null
                && !request.title().isBlank()
                ? request.title()
                : "Chat with " + repo.getFullName();

        ChatSession session = ChatSession.builder()
                .userId(userId)
                .repositoryId(repo.getId())
                .title(title)
                .build();

        session = chatSessionRepository.save(session);

        return toSessionResponse(session);
    }

    @Transactional(readOnly = true)
    public List<ChatSessionResponse> listSessions(
            UUID userId,
            UUID repositoryId) {

        repoService.requiredOwned(repositoryId, userId);

        return chatSessionRepository
                .findByUserIdAndRepositoryIdOrderByCreatedAtDesc(
                        userId,
                        repositoryId
                )
                .stream()
                .map(this::toSessionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(
            UUID userId,
            UUID sessionId) {

        ChatSession session = requireSession(userId, sessionId);

        return chatMessageRepository
                .findBySessionIdOrderByCreatedAtAsc(session.getId())
                .stream()
                .map(this::toMessageResponse)
                .toList();
    }

    @Transactional
    public void deleteSession(UUID userId, UUID sessionId) {

        ChatSession session = chatSessionRepository
                .findByIdAndUserId(sessionId, userId)
                .orElseThrow(() ->
                        new NotFoundException("Chat session not found")
                );

        chatMessageRepository.deleteBySessionId(session.getId());
        chatSessionRepository.delete(session);
    }

    @Transactional(readOnly = true)
    public ChatSession requireSession(
            UUID userId,
            UUID sessionId) {

        return chatSessionRepository
                .findByIdAndUserId(sessionId, userId)
                .orElseThrow(() ->
                        new NotFoundException("Chat session not found")
                );
    }

    public SseEmitter streamReply(
            UUID userId,
            UUID sessionId,
            String rawContent) {

        // 0. Validate input (bean validation is not on the classpath).
        String userContent = rawContent == null ? "" : rawContent.trim();

        if (userContent.isEmpty()) {
            throw new BadRequestException("Message cannot be empty");
        }

        if (userContent.length() > MAX_MESSAGE_CHARS) {
            throw new BadRequestException(
                    "Message is too long (max " + MAX_MESSAGE_CHARS + " characters)"
            );
        }

        // 1. Ensure the session exists and the repository is indexed.
        ChatSession session = requireSession(userId, sessionId);

        Repository repo = repoService.requiredOwned(
                session.getRepositoryId(),
                userId
        );

        if (repo.getIndexStatus() != IndexStatus.READY) {
            throw new BadRequestException(
                    "Repository is not ready for chat"
            );
        }

        // 2. Load earlier turns (before saving the new message) for follow-ups.
        List<ChatMessage> history = chatMessageRepository
                .findBySessionIdOrderByCreatedAtAsc(session.getId());

        // 3. Name the chat after its first question.
        if (history.isEmpty() && isDefaultTitle(session.getTitle())) {
            session.setTitle(toTitle(userContent));
            chatSessionRepository.save(session);
        }

        // 4. Persist the user's message.
        ChatMessage userMessage = chatMessageRepository.save(
                ChatMessage.builder()
                        .sessionId(session.getId())
                        .role(MessageRole.USER)
                        .content(userContent)
                        .build()
        );

        // 5. RAG retrieval — short follow-ups borrow the previous question
        //    so that "and where is it used?" still finds relevant chunks.
        String retrievalQuery = userContent;

        if (userContent.length() < 80) {
            String previousQuestion = lastUserQuestion(history);
            if (previousQuestion != null) {
                retrievalQuery = previousQuestion + "\n" + userContent;
            }
        }

        var retrievedContext = codeContextRetriever.retrieve(
                repo.getId(),
                retrievalQuery
        );

        // 6. Build LLM prompts from retrieved context, history and question.
        String systemPrompt = chatPromptBuilder.systemPrompt(
                repo.getFullName()
        );

        String userPrompt = chatPromptBuilder.userPrompt(
                retrievedContext.contextText(),
                formatHistory(history),
                userContent
        );

        // 7. Stream the response to the client using SSE.
        return chatStreamHandler.stream(
                session.getId(),
                toMessageResponse(userMessage),
                retrievedContext.citations(),
                systemPrompt,
                userPrompt
        );
    }

    private static boolean isDefaultTitle(String title) {
        return title == null
                || title.isBlank()
                || "New chat".equalsIgnoreCase(title.trim())
                || title.startsWith("Chat with ");
    }

    private static String toTitle(String question) {
        String single = question.replaceAll("\\s+", " ").trim();

        return single.length() <= TITLE_MAX_CHARS
                ? single
                : single.substring(0, TITLE_MAX_CHARS - 1).trim() + "…";
    }

    private static String lastUserQuestion(List<ChatMessage> history) {
        for (int i = history.size() - 1; i >= 0; i--) {
            if (history.get(i).getRole() == MessageRole.USER) {
                return history.get(i).getContent();
            }
        }
        return null;
    }

    private static String formatHistory(List<ChatMessage> history) {
        if (history.isEmpty()) {
            return "";
        }

        int from = Math.max(0, history.size() - HISTORY_MESSAGES);
        StringBuilder sb = new StringBuilder();

        for (ChatMessage message : history.subList(from, history.size())) {
            String content = message.getContent() == null ? "" : message.getContent();

            if (content.length() > HISTORY_CHARS_PER_MESSAGE) {
                content = content.substring(0, HISTORY_CHARS_PER_MESSAGE) + "…";
            }

            sb.append(message.getRole() == MessageRole.USER ? "User: " : "Assistant: ")
                    .append(content)
                    .append("\n");
        }

        return sb.toString().trim();
    }

    private ChatSessionResponse toSessionResponse(
            ChatSession session) {

        return new ChatSessionResponse(
                session.getId(),
                session.getRepositoryId(),
                session.getTitle(),
                session.getCreatedAt()
        );
    }

    private ChatMessageResponse toMessageResponse(
            ChatMessage message) {

        return new ChatMessageResponse(
                message.getId(),
                message.getRole(),
                message.getContent(),
                citationMapper.fromJson(message.getCitations()),
                message.getCreatedAt()
        );
    }

}
