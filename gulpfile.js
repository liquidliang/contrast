var gulp = require('gulp');
var open= require('gulp-open');
var serve = require('gulp-serve');

gulp.task('serve', serve({
  root: 'public',
  port: 3000,
}));

gulp.task('open', function(){
    gulp.src(__filename)
    .pipe(open({
        app: "chrome",
        uri: 'http://localhost:3000'
    }));
});
gulp.task('default', ['serve', 'open']);