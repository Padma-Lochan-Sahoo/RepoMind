package repoMind.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import repoMind.backend.entity.IndexStatus;
import repoMind.backend.entity.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RepositoryRepository extends JpaRepository<Repository, UUID> {

    List<Repository> findByUserIdOrderByFullNameAsc(UUID userId);

    Optional<Repository> findByIdAndUserId(UUID id,UUID userId);

    Optional<Repository> findByUserIdAndGithubRepoId(UUID userId, Long githubRepoId);

    List<Repository> findByIndexStatus(IndexStatus indexStatus);
    
}
