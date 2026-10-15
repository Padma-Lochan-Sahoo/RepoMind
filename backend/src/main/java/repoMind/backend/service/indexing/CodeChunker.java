package repoMind.backend.service.indexing;

import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import repoMind.backend.service.ai.RagSettings;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class CodeChunker {
    private final TokenTextSplitter splitter;
    private final CodeFileFilter fileFilter;

    public CodeChunker(
            @Value("${app.indexing.chunk-size:800}") int chunkSize,
            CodeFileFilter fileFilter
    ){
        int chunkTokens = Math.max(50, chunkSize/4);

        this.splitter = TokenTextSplitter.builder()
                .withChunkSize(chunkTokens)
                .build();

        this.fileFilter = fileFilter;
    }

    public List<Document> chunkFile(
            String repoId,
            String filePath,
            String content
    ) {
        if (content == null || content.isBlank()) {
            return List.of();
        }

        String language = fileFilter.detectLanguage(filePath);
        String header = "// File: " + filePath + "\n";

        Document source = new Document(
                header + content,
                baseMetadata(repoId, filePath, language)
        );

        List<Document> split = splitter.apply(List.of(source));

        String full = header + content;
        int cursor = 0;
        List<Document> result = new java.util.ArrayList<>(split.size());

        for (int i = 0; i < split.size(); i++) {
            Document chunk = split.get(i);
            String text = chunk.getText();

            int[] lines = null;

            if (text != null && !text.isBlank()) {
                // Chunks are contiguous slices of the source, so search forward
                // first, then fall back to a global search.
                int index = full.indexOf(text, cursor);
                if (index < 0) {
                    index = full.indexOf(text);
                }

                if (index >= 0) {
                    lines = new int[]{
                            lineAt(full, index),
                            lineAt(full, index + text.length() - 1)
                    };
                    cursor = index + 1;
                }
            }

            result.add(withChunkIndex(
                    chunk,
                    repoId,
                    filePath,
                    language,
                    i,
                    lines
            ));
        }

        return result;
    }

    /**
     * 1-based line number (within the original file, i.e. ignoring the
     * synthetic header line) of a character offset in header + content.
     */
    private static int lineAt(String full, int position) {
        int newlines = 0;
        int limit = Math.min(position, full.length());

        for (int i = 0; i < limit; i++) {
            if (full.charAt(i) == '\n') {
                newlines++;
            }
        }

        return Math.max(1, newlines);
    }

    private static Map<String, Object> baseMetadata(
            String repoId,
            String filePath,
            String language
    ) {
        Map<String, Object> metadata = new HashMap<>();

        metadata.put(RagSettings.METADATA_REPO_ID, repoId);
        metadata.put("filePath", filePath);
        metadata.put("language", language);

        return metadata;
    }

    private static Document withChunkIndex(
            Document chunk,
            String repoId,
            String filePath,
            String language,
            int chunkIndex,
            int[] lines
    ){
        Map<String,Object> metadata = new HashMap<>(chunk.getMetadata());
        metadata.put(RagSettings.METADATA_REPO_ID,repoId);
        metadata.put("filePath", filePath);
        metadata.put("language", language);
        metadata.put("chunkIndex", chunkIndex);

        if (lines != null) {
            metadata.put("startLine", lines[0]);
            metadata.put("endLine", Math.max(lines[0], lines[1]));
        }

        return new Document(chunk.getText(),metadata);
    }

}
