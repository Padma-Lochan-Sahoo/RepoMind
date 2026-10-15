package repoMind.backend.service.ai;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.Disposable;
import repoMind.backend.dto.ChatMessageResponse;
import repoMind.backend.dto.CitationDto;
import repoMind.backend.entity.ChatMessage;
import repoMind.backend.entity.MessageRole;
import repoMind.backend.repository.ChatMessageRepository;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChatStreamHandler {

    private static final String FRIENDLY_ERROR =
            "The AI service could not complete this answer. Please try again.";

    private final ChatModel chatModel;
    private final ChatMessageRepository chatMessageRepository;
    private final CitationMapper citationMapper;

    public SseEmitter stream(
            UUID sessionId,
            ChatMessageResponse savedUserMessage,
            List<CitationDto> citations,
            String systemPrompt,
            String userPrompt) {

        SseEmitter emitter =
                new SseEmitter(RagSettings.STREAM_TIMEOUT_MS);

        // Written from the reactive thread and read from container threads.
        StringBuffer fullReply = new StringBuffer();
        AtomicBoolean finished = new AtomicBoolean(false);
        AtomicReference<Disposable> subscription = new AtomicReference<>();

        // Runs when the client disconnects (e.g. "Stop generating"), the
        // stream times out, or the emitter errors: stop the model call and
        // keep whatever was generated so far.
        Runnable onClose = () -> {
            Disposable current = subscription.get();
            if (current != null && !current.isDisposed()) {
                current.dispose();
            }

            if (finished.compareAndSet(false, true) && fullReply.length() > 0) {
                savePartial(sessionId, fullReply.toString(), citations);
            }
        };

        emitter.onCompletion(onClose);
        emitter.onTimeout(onClose);
        emitter.onError(ex -> onClose.run());

        try {
            emitter.send(SseEmitter.event()
                    .name("user_message")
                    .data(savedUserMessage));

            Disposable disposable = ChatClient.builder(chatModel)
                    .build()
                    .prompt()
                    .system(systemPrompt)
                    .user(userPrompt)
                    .stream()
                    .content()
                    .doOnNext(token ->
                            appendToken(emitter, fullReply, token))
                    .doOnError(err -> {
                        log.error("Chat stream error", err);
                        failStream(
                                emitter,
                                finished,
                                sessionId,
                                fullReply,
                                citations);
                    })
                    .doOnComplete(() ->
                            completeStream(
                                    emitter,
                                    finished,
                                    sessionId,
                                    fullReply,
                                    citations))
                    // Errors are already handled in doOnError; an explicit
                    // error consumer stops Reactor logging them a second time.
                    .subscribe(token -> { }, err -> { });

            subscription.set(disposable);

        } catch (Exception ex) {
            log.error("Could not start chat stream", ex);
            failStream(emitter, finished, sessionId, fullReply, citations);
        }

        return emitter;
    }

    private void appendToken(
            SseEmitter emitter,
            StringBuffer fullReply,
            String token) {

        if (token == null) {
            return;
        }

        fullReply.append(token);

        try {
            emitter.send(SseEmitter.event()
                    .name("token")
                    .data(token, MediaType.APPLICATION_JSON));

        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    private void completeStream(
            SseEmitter emitter,
            AtomicBoolean finished,
            UUID sessionId,
            StringBuffer fullReply,
            List<CitationDto> citations) {

        if (!finished.compareAndSet(false, true)) {
            return;
        }

        try {
            ChatMessage assistant = chatMessageRepository.save(
                    ChatMessage.builder()
                            .sessionId(sessionId)
                            .role(MessageRole.ASSISTANT)
                            .content(fullReply.toString())
                            .citations(citationMapper.toJson(citations))
                            .build()
            );

            emitter.send(SseEmitter.event()
                    .name("assistant_message")
                    .data(toMessageResponse(assistant)));

            emitter.send(SseEmitter.event()
                    .name("done")
                    .data("{}", MediaType.APPLICATION_JSON));

            emitter.complete();

        } catch (Exception ex) {
            emitter.completeWithError(ex);
        }
    }

    private void failStream(
            SseEmitter emitter,
            AtomicBoolean finished,
            UUID sessionId,
            StringBuffer fullReply,
            List<CitationDto> citations) {

        // Already closed (client left) or completed: nothing more to tell anyone.
        if (!finished.compareAndSet(false, true)) {
            return;
        }

        if (fullReply.length() > 0) {
            savePartial(sessionId, fullReply.toString(), citations);
        }

        try {
            emitter.send(SseEmitter.event()
                    .name("error")
                    .data(FRIENDLY_ERROR, MediaType.APPLICATION_JSON));

            emitter.complete();

        } catch (Exception ex) {
            emitter.completeWithError(ex);
        }
    }

    private void savePartial(
            UUID sessionId,
            String content,
            List<CitationDto> citations) {

        try {
            chatMessageRepository.save(
                    ChatMessage.builder()
                            .sessionId(sessionId)
                            .role(MessageRole.ASSISTANT)
                            .content(content)
                            .citations(citationMapper.toJson(citations))
                            .build()
            );
        } catch (Exception ex) {
            log.warn("Could not save partial reply for session {}: {}",
                    sessionId, ex.getMessage());
        }
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
