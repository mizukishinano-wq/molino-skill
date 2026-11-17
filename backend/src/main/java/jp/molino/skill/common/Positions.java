package jp.molino.skill.common;

import java.util.List;

public final class Positions {
    public static final List<String> NAMES = List.of("朝食", "ドリンク", "フリー", "デシャップ", "入口", "8階", "ディナー", "営業外");

    private Positions() {
    }

    public static boolean contains(String name) {
        return NAMES.contains(name);
    }
}
