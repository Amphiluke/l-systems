"use strict";

let gulp = require("gulp"),
    babel = require("gulp-babel"),
    rename = require("gulp-rename"),
    replace = require("gulp-replace"),
    less = require("gulp-less"),
    LessPluginCleanCSS = require("less-plugin-clean-css"),
    Builder = require("systemjs-builder");


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


gulp.task("scripts-prod", ["transpile"], () => {
    let builder = new Builder("./src/js/");
    return builder.bundle("index.sys.js", "build/js/index.sys.js");
});

gulp.task("styles-prod", ["styles-dev"], () => {
    return gulp.src("src/css/main.css")
        .pipe(gulp.dest("build/css/"));
});

gulp.task("html-prod", () => {
    return gulp.src("src/index.html")
        .pipe(gulp.dest("build/"));
});

gulp.task("lib-prod", () => {
    return gulp.src("src/lib/bank.json")
        .pipe(gulp.dest("build/lib/"));
});

gulp.task("img-prod", () => {
    return gulp.src("src/img/**/*")
        .pipe(gulp.dest("build/img/"));
});

gulp.task("build", ["scripts-prod", "styles-prod", "html-prod", "lib-prod", "img-prod"]);