package jp.molino.skill.task;

import java.util.List;

/** 仕事詳細画面に返す値。仕事の情報と、その仕事ができる人の一覧。 */
public record TaskDetailResponse(TaskResponse task, List<Person> people) {

    /** 仕事ができる人1人分。習熟度と、その習熟度になった日を持つ。 */
    public record Person(Long staffId, String name, String position, boolean newcomer, int level, String updatedOn) {
    }
}
