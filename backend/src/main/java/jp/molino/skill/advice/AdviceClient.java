package jp.molino.skill.advice;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.core.JsonSchemaLocalValidation;
import com.anthropic.errors.AnthropicIoException;
import com.anthropic.errors.AnthropicServiceException;
import com.anthropic.errors.RateLimitException;
import com.anthropic.models.beta.messages.BetaOutputConfig;
import com.anthropic.models.beta.messages.BetaStopReason;
import com.anthropic.models.beta.messages.MessageCreateParams;
import com.anthropic.models.beta.messages.StructuredMessage;
import com.anthropic.models.beta.messages.StructuredMessageCreateParams;
import com.anthropic.models.beta.messages.StructuredOutputConfig;
import java.time.Duration;
import jp.molino.skill.common.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Claude API を呼ぶ部分。API キーは環境変数 ANTHROPIC_API_KEY から読み、コードには書かない。
 * キーがない環境（ローカルや実店舗向け）では、呼ばれたときに 503 を返す。
 */
@Component
public class AdviceClient {
    private static final Logger log = LoggerFactory.getLogger(AdviceClient.class);
    // 画面側の転送（Vercel）は最大60秒しか待たないため、それより短くする
    private static final Duration TIMEOUT = Duration.ofSeconds(50);
    private static final long MAX_TOKENS = 8000L;

    private final AnthropicClient client;
    private final String model;

    public AdviceClient(@Value("${app.ai.api-key:}") String apiKey, @Value("${app.ai.model}") String model) {
        this.client = apiKey.isBlank() ? null
                : AnthropicOkHttpClient.builder().apiKey(apiKey).timeout(TIMEOUT).maxRetries(1).build();
        this.model = model;
    }

    public AiAdvice ask(String systemPrompt, String userPrompt) {
        if (client == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI の設定がされていないため、アドバイスを作れません");
        }
        StructuredMessageCreateParams<AiAdvice> params = MessageCreateParams.builder()
                .model(model)
                .maxTokens(MAX_TOKENS)
                .system(systemPrompt)
                .addUserMessage(userPrompt)
                // 安全のため AI が回答を断った場合に、サーバー側で別のモデルに切り替えて答えさせる
                .addBeta("server-side-fallback-2026-07-01")
                .fallbacksDefault()
                // 仕事を選ぶ程度の判断なので、考える量（effort）は少なめにして応答を速くする
                .outputConfig(StructuredOutputConfig.<AiAdvice>builder()
                        .format(AiAdvice.class, JsonSchemaLocalValidation.YES)
                        .effort(BetaOutputConfig.Effort.LOW)
                        .build())
                .build();
        try {
            StructuredMessage<AiAdvice> message = client.beta().messages().create(params);
            log.info("AI advice: model={}, input_tokens={}, output_tokens={}",
                    message.model(), message.usage().inputTokens(), message.usage().outputTokens());
            if (message.stopReason().filter(BetaStopReason.REFUSAL::equals).isPresent()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "AI が回答できませんでした。時間をおいてやり直してください");
            }
            return message.content().stream()
                    .flatMap(block -> block.text().stream())
                    .map(text -> text.text())
                    .findFirst()
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_GATEWAY, "AI の回答を読み取れませんでした"));
        } catch (RateLimitException exception) {
            log.warn("AI rate limited: {}", exception.getMessage());
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI が混み合っています。しばらくしてからやり直してください");
        } catch (AnthropicServiceException exception) {
            // 400（支出上限に達した、など）や 5xx。内容はログにだけ残し、画面には一般的な文を出す
            log.warn("AI request failed: status={}, message={}", exception.statusCode(), exception.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI に接続できませんでした。しばらくしてからやり直してください");
        } catch (AnthropicIoException exception) {
            log.warn("AI connection failed: {}", exception.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI に接続できませんでした。しばらくしてからやり直してください");
        }
    }
}
