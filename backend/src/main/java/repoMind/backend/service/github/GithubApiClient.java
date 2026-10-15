
package repoMind.backend.service.github;

import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GithubApiClient {

    private static final String API_BASE = "https://api.github.com";

    private static final ParameterizedTypeReference<
            List<Map<String, Object>>> LIST_MAP =
            new ParameterizedTypeReference<>() {};

    private static final ParameterizedTypeReference<
            Map<String, Object>> MAP =
            new ParameterizedTypeReference<>() {};

    private final RestClient.Builder restClientBuilder;

    public List<Map<String, Object>> listUserRepo(String accessToken) {

        List<Map<String, Object>> all = new ArrayList<>();

        int page = 1;
        final int maxPages = 10;
        final int pageSize = 100;

        while (page <= maxPages) {

            final int currentPage = page;

            List<Map<String, Object>> pageRepos = client(accessToken)
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/user/repos")
                            .queryParam(
                                    "affiliation",
                                    "owner,collaborator,organization_member"
                            )
                            .queryParam("sort", "updated")
                            .queryParam("per_page", pageSize)
                            .queryParam("page", currentPage)
                            .build()
                    )
                    .retrieve()
                    .body(LIST_MAP);

            if (pageRepos == null || pageRepos.isEmpty()) {
                break;
            }

            all.addAll(pageRepos);

            if (pageRepos.size() < pageSize) {
                break;
            }

            page++;
        }

        return all;
    }

    public Map<String, Object> getRepoTree(
            String accessToken,
            String owner,
            String repo,
            String branch
    ) {

        return client(accessToken)
                .get()
                .uri(uriBuilder -> uriBuilder
                        .path("/repos/{owner}/{repo}/git/trees/{branch}")
                        .queryParam("recursive", "1")
                        .build(owner, repo, branch)
                )
                .retrieve()
                .body(MAP);
    }

    public String getFileContent(
            String accessToken,
            String owner,
            String repo,
            String path
    ) {

        Map<String, Object> body = client(accessToken)
                .get()
                .uri(uriBuilder -> uriBuilder
                        .path("/repos/{owner}/{repo}/contents/")
                        .path(path)
                        .build(owner, repo)
                )
                .retrieve()
                .body(MAP);

        if (body == null) {
            return null;
        }

        Object encoding = body.get("encoding");
        Object content = body.get("content");

        if (content == null) {
            return null;
        }

        String contentString = String.valueOf(content);

        if ("base64".equals(encoding)) {
            String raw = contentString.replaceAll("\\s+", "");

            byte[] decoded = Base64.getDecoder().decode(raw);

            return new String(decoded, StandardCharsets.UTF_8);
        }

        return contentString;
    }

    private RestClient client(String accessToken) {

        // clone(): the injected builder is a shared singleton; mutating it directly
        // would accumulate Authorization headers across users/requests.
        return restClientBuilder.clone()
                .baseUrl(API_BASE)
                .defaultHeader(
                        HttpHeaders.AUTHORIZATION,
                        "Bearer " + accessToken
                )
                .defaultHeader(
                        HttpHeaders.ACCEPT,
                        "application/vnd.github+json"
                )
                .defaultHeader(
                        "X-GitHub-Api-Version",
                        "2022-11-28"
                )
                .defaultHeader(
                        HttpHeaders.USER_AGENT,
                        "RepoMind"
                )
                .build();
    }
}
