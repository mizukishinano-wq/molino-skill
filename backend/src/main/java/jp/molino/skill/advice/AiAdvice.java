package jp.molino.skill.advice;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import java.util.List;

/**
 * AI に返させる回答の形（構造化出力）。
 * この record から JSON スキーマが作られ、AI はこの形の JSON だけを返す。
 */
public record AiAdvice(
        @JsonPropertyDescription("育成の方針の要約。1〜2文") String overview,
        @JsonPropertyDescription("次に教えるとよい仕事。優先度の高い順に最大3件") List<Suggestion> suggestions) {

    public record Suggestion(
            @JsonPropertyDescription("候補の一覧にある仕事名をそのまま書く") String taskName,
            @JsonPropertyDescription("その仕事を次に教えるとよい理由。60文字程度") String reason) {
    }
}
