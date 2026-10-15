package repoMind.backend.service.indexing;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import repoMind.backend.entity.IndexStatus;
import repoMind.backend.entity.Repository;
import repoMind.backend.exceptions.BadRequestException;
import repoMind.backend.exceptions.NotFoundException;
import repoMind.backend.repository.RepositoryRepository;
import repoMind.backend.service.UserService;
import repoMind.backend.service.ai.RagSettings;
import repoMind.backend.service.github.GitHubRateLimiter;
import repoMind.backend.service.github.GithubApiClient;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class IndexingService {

    private static final int VECTOR_BATCH_SIZE = 32;
    private static final int PROGRESS_EVERY_N_FILES = 5;

    private final RepositoryRepository repositoryRepository;
    private final UserService userService;
    private final GithubApiClient githubApiClient;
    private final CodeFileFilter fileFilter;
    private final CodeChunker codeChunker;
    private final GitHubRateLimiter rateLimiter;
    private final VectorStore vectorStore;

    @Value("${app.indexing.max-file-bytes:102400}")
    private long maxFileBytes;

    public Repository startIndexing(UUID repoId,UUID userId){
        Repository repo = repositoryRepository.findByIdAndUserId(repoId,userId)
                .orElseThrow(() -> new NotFoundException("Repository not found"));

        if(repo.getIndexStatus() == IndexStatus.INDEXING){
            throw new BadRequestException("Repository is already being indexed");
        }

        repo.setIndexStatus(IndexStatus.INDEXING);
        repo.setFilesProcessed(0);
        repo.setFilesTotal(0);
        repo.setChunkCount(0);
        repo.setErrorMessage(null);
        repo.setUpdatedAt(Instant.now());

        return repositoryRepository.save(repo);
    }

    /**
     * Indexing runs on in-memory worker threads. If the server stops mid-run,
     * the repository would stay INDEXING forever (and could never be retried),
     * so mark such leftovers as FAILED on startup.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void recoverInterruptedIndexing() {
        try {
            List<Repository> stuck =
                    repositoryRepository.findByIndexStatus(IndexStatus.INDEXING);

            for (Repository repo : stuck) {
                repo.setIndexStatus(IndexStatus.FAILED);
                repo.setErrorMessage(
                        "Indexing was interrupted by a server restart. Please retry."
                );
                repo.setUpdatedAt(Instant.now());
                repositoryRepository.save(repo);
            }

            if (!stuck.isEmpty()) {
                log.warn("Marked {} interrupted indexing job(s) as FAILED", stuck.size());
            }
        } catch (Exception ex) {
            log.warn("Could not recover interrupted indexing jobs: {}", ex.getMessage());
        }
    }

    @Async("indexingExecutor")
    public void indexAsync(UUID repoId, UUID userId){
        try{
            doIndex(repoId, userId);
        } catch (Exception e) {
            log.error("Indexing failed for repo {}", repoId, e);
            markFailed(repoId, e.getMessage());
        }
    }

    private void doIndex(UUID repoId, UUID userId) {
        Repository repo = repositoryRepository.findById(repoId)
                .orElseThrow(() ->
                        new NotFoundException("Repository not found"));

        String token = userService.decryptAccessToken(
                userService.requiredById(userId)
        );

        // Remove previously indexed vectors before re-indexing.
        deleteExistingVectors(repoId.toString());

        // Fetch the repository tree from GitHub.
        Map<String, Object> tree = githubApiClient.getRepoTree(
                token,
                repo.getOwner(),
                repo.getName(),
                repo.getDefaultBranch()
        );

        List<String> filePaths = listIndexableFiles(tree);

        if (filePaths.isEmpty()) {
            throw new BadRequestException(
                    "No indexable source files were found in this repository "
                            + "(unsupported file types, empty repository, or files over the size limit)."
            );
        }

        updateProgress(
                repoId,
                filePaths.size(),
                0,
                0,
                IndexStatus.INDEXING,
                null
        );

        List<Document> batch = new ArrayList<>();
        int processed = 0;
        int totalChunks = 0;

        for (String path : filePaths) {
            try {
                String content = githubApiClient.getFileContent(
                        token,
                        repo.getOwner(),
                        repo.getName(),
                        path
                );

                List<Document> chunks = codeChunker.chunkFile(
                        repoId.toString(),
                        path,
                        content
                );

                batch.addAll(chunks);
                totalChunks += chunks.size();

            } catch (Exception ex) {
                log.warn(
                        "Skipping file {} in {}: {}",
                        path,
                        repo.getFullName(),
                        ex.getMessage()
                );
            }

            // Save documents in batches. Kept outside the per-file try/catch so
            // that embedding/vector-store failures (e.g. an invalid OpenAI key)
            // fail the whole job with a clear error instead of being swallowed.
            if (batch.size() >= VECTOR_BATCH_SIZE) {
                vectorStore.add(new ArrayList<>(batch));
                batch.clear();
            }

            processed++;

            if (processed % PROGRESS_EVERY_N_FILES == 0
                    || processed == filePaths.size()) {
                updateProgress(
                        repoId,
                        filePaths.size(),
                        processed,
                        totalChunks,
                        IndexStatus.INDEXING,
                        null
                );
            }

            rateLimiter.pause();
        }

        // Save remaining documents.
        if (!batch.isEmpty()) {
            vectorStore.add(new ArrayList<>(batch));
        }

        if (totalChunks == 0) {
            throw new IllegalStateException(
                    "None of the repository files could be read or chunked. "
                            + "Check that your GitHub token still has access to this repository."
            );
        }

        // Mark indexing as complete.
        markReady(
                repoId,
                filePaths.size(),
                processed,
                totalChunks,
                repo.getFullName()
        );
    }


    @SuppressWarnings("unchecked")
    private List<String> listIndexableFiles(Map<String, Object> tree) {
        if (tree == null || tree.get("tree") == null) {
            return List.of();
        }

        List<Map<String, Object>> entries =
                (List<Map<String, Object>>) tree.get("tree");

        return entries.stream()
                .filter(entry ->
                        "blob".equals(String.valueOf(entry.get("type"))))
                .filter(entry -> {
                    String path = String.valueOf(entry.get("path"));

                    long size = entry.get("size") instanceof Number n
                            ? n.longValue()
                            : 0L;

                    return fileFilter.isEligible(path, size, maxFileBytes);
                })
                .map(entry -> String.valueOf(entry.get("path")))
                .toList();
    }

    private void deleteExistingVectors(String repoId) {
        try {
            var filter = new FilterExpressionBuilder()
                    .eq(RagSettings.METADATA_REPO_ID, repoId)
                    .build();

            vectorStore.delete(filter);

        } catch (Exception ex) {
            log.warn(
                    "Could not delete existing vectors for repo {}: {}",
                    repoId,
                    ex.getMessage()
            );
        }
    }

    @Transactional
    protected void updateProgress(
            UUID repoId,
            int total,
            int processed,
            int chunks,
            IndexStatus status,
            String error
    ) {
        repositoryRepository.findById(repoId).ifPresent(repo -> {
            repo.setFilesTotal(total);
            repo.setFilesProcessed(processed);
            repo.setChunkCount(chunks);
            repo.setIndexStatus(status);
            repo.setErrorMessage(error);
            repo.setUpdatedAt(Instant.now());

            repositoryRepository.save(repo);
        });
    }

    @Transactional
    protected void markReady(
            UUID repoId,
            int totalFiles,
            int processedFiles,
            int totalChunks,
            String fullName
    ) {
        repositoryRepository.findById(repoId).ifPresent(repo -> {
            repo.setIndexStatus(IndexStatus.READY);
            repo.setFilesTotal(totalFiles);
            repo.setFilesProcessed(processedFiles);
            repo.setChunkCount(totalChunks);
            repo.setIndexedAt(Instant.now());
            repo.setErrorMessage(null);
            repo.setUpdatedAt(Instant.now());

            repositoryRepository.save(repo);
        });

        log.info(
                "Indexed {} files ({} chunks) for {}",
                processedFiles,
                totalChunks,
                fullName
        );
    }


    @Transactional
    protected void markFailed(UUID repoId, String message) {
        repositoryRepository.findById(repoId).ifPresent(repo -> {
            repo.setIndexStatus(IndexStatus.FAILED);
            repo.setErrorMessage(
                    message != null && message.length() > 2000
                            ? message.substring(0, 2000)
                            : message
            );
            repo.setUpdatedAt(Instant.now());

            repositoryRepository.save(repo);
        });
    }




}
