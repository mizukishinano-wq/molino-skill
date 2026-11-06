package jp.molino.skill.common;

import java.util.List;
import java.util.Map;
import jp.molino.skill.task.WorkTask;

public final class TaskOrder {
    private static final Map<String, List<String>> NAMES = Map.of(
            "ドリンク", List.of("生ビール", "サワー・ハイボール", "カクテル", "マシン飲料（紅茶・コーヒー・カフェオレ）", "ラテ系（抹茶・キャラメル）", "準備・補充"),
            "フリー", List.of("オーダー取り", "料理説明", "配膳", "バッシング", "フロア対応"),
            "デシャップ", List.of("アレルギー・皿チェック", "指示出し", "先読み"),
            "入口", List.of("予約受付", "お会計", "席の指示", "周囲を見る"),
            "8階", List.of("少人数で回す", "7階に頼む物の把握"),
            "営業外", List.of("営業前・営業後・パソコン"));

    private TaskOrder() {
    }

    public static int index(WorkTask task) {
        int position = Positions.NAMES.indexOf(task.getPosition());
        if (position < 0) {
            position = 99;
        }
        int name = NAMES.getOrDefault(task.getPosition(), List.of()).indexOf(task.getName());
        if (name < 0) {
            name = 99;
        }
        return position * 100 + name;
    }
}
