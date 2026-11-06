package jp.molino.skill.common;

import java.util.List;

public final class Positions {
    public static final List<String> NAMES = List.of("ドリンク", "フリー", "デシャップ", "入口", "8階", "営業外");

    private Positions() {
    }

    public static boolean contains(String name) {
        return NAMES.contains(name);
    }
}
