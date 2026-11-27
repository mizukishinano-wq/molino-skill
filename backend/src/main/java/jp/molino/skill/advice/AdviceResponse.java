package jp.molino.skill.advice;

import java.util.List;

/** 画面に返す育成のアドバイス。AI の提案に、教えられる人（DB から選んだ人）を加えたもの。 */
public record AdviceResponse(String overview, List<Suggestion> suggestions) {

    /**
     * @param currentLevel その仕事の今の習熟度（0 は未経験）
     * @param teachers     この仕事を教えられる（習熟度3の）在籍中のスタッフ名
     */
    public record Suggestion(Long taskId, String taskName, String position, int currentLevel, String reason, List<String> teachers) {
    }
}
