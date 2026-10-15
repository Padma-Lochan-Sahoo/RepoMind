package repoMind.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import repoMind.backend.dto.ChatMessageRequest;
import repoMind.backend.dto.ChatMessageResponse;
import repoMind.backend.dto.ChatSessionResponse;
import repoMind.backend.dto.CreateChatSessionRequest;
import repoMind.backend.exceptions.BadRequestException;
import repoMind.backend.security.CurrentUser;
import repoMind.backend.service.ChatService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final CurrentUser currentUser;
    private final ChatService chatService;

    @PostMapping("/sessions")
    public ResponseEntity<ChatSessionResponse> createSession(
            @RequestBody CreateChatSessionRequest request) {

        if (request == null || request.repositoryId() == null) {
            throw new BadRequestException("repositoryId is required");
        }

        UUID userId = currentUser.require().getId();

        return ResponseEntity.ok(
                chatService.createSession(userId, request)
        );
    }

    @GetMapping("/sessions")
    public List<ChatSessionResponse> listSessions(
            @RequestParam UUID repositoryId) {

        UUID userId = currentUser.require().getId();

        return chatService.listSessions(userId, repositoryId);
    }

    @GetMapping("/sessions/{id}")
    public List<ChatMessageResponse> getMessages(
            @PathVariable UUID id) {

        UUID userId = currentUser.require().getId();

        return chatService.getMessages(userId, id);
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<Void> deleteSession(
            @PathVariable UUID id) {

        UUID userId = currentUser.require().getId();

        chatService.deleteSession(userId, id);

        return ResponseEntity.noContent().build();
    }

    @PostMapping(
            value = "/sessions/{id}/messages",
            produces = MediaType.TEXT_EVENT_STREAM_VALUE
    )
    public SseEmitter sendMessage(
            @PathVariable UUID id,
            @RequestBody ChatMessageRequest request) {

        UUID userId = currentUser.require().getId();

        return chatService.streamReply(
                userId,
                id,
                request.content()
        );
    }

}
