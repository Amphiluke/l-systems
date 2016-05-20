"use strict";

let gulp = require("gulp"),
    babel = require("gulp-babel"),
    rename = require("gulp-rename"),
    replace = require("gulp-replace"),
    less = require("gulp-less"),
    LessPluginCleanCSS = require("less-plugin-clean-css");


gulp.task("transpile", () => {
    let importRE = /import\s+((?:\w+|\*)\s+from\s+)?"([\w.\/\-]+).js"/g,
        replacement = "import $1\"$2.sys.js\"";
    return gulp.src(["src/js/**/*.js", "!src/js/**/*.sys.js"])
        .pipe(replace(importRE, replacement))
        .pipe(babel())
        .pipe(rename({suffix: ".sys"}))
        .pipe(gulp.dest("src/js/"));
});

gulp.task("styles-dev", () => {
    let cleanCSS = new LessPluginCleanCSS({advanced: true});
    return gulp.src("src/css/main.less")
        .pipe(less({plugins: [cleanCSS]}))
        .pipe(gulp.dest("src/css/"));
});

gulp.task("prepare", ["transpile", "styles-dev"]);
