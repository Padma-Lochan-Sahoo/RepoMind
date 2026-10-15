package repoMind.backend.service.ai;

import repoMind.backend.dto.CitationDto;

import java.util.List;

public record RetrievedContext(
        List<CitationDto> citations,
        String contextText
) {
}
