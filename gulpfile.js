
var gulp = require('gulp'),
  prefix = require('gulp-autoprefixer'),
  sass = require('gulp-sass');

  gulp.task('sass', function () {
    return gulp.src('./app/public/sass/*.sass')
      .pipe(sass().on('error', sass.logError))
      .pipe(gulp.dest('./app/public/css'));
  });

gulp.task('default', function () {
  gulp.watch('./app/public/sass/*.sass', ['sass']);
  // Run the recorder script
  require('./app/server.js');
});
