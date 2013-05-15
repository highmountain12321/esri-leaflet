module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef:  true,
        boss: true,
        eqnull: true,
        browser: true,
        globals: {
          XMLHttpRequest: true,
          ActiveXObject: true,
          module: true,
          L:true
        }
      },
      all: ['Gruntfile.js', 'src/**/*.js']
    },
    watch: {
      files: ['Gruntfile.js', 'src/**/*.js'],
      tasks: 'default'
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '*   Copyright (c) <%= grunt.template.today("yyyy") %> Environmental Systems Research Institute, Inc.\n' +
        '*   Apache License' +
        '*/\n\n'
      },
      dist: {
        files: {
          'dist/esri-leaflet.min.js': ['src/**/*.js']
        }
      },
      versioned: {
        files: {
          'dist/versions/esri-leaflet-<%= pkg.version %>.min.js': ['src/**/*.js']
        }
      }
    },
    cssmin: {
      options: {
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '*   Copyright (c) <%= grunt.template.today("yyyy") %> Environmental Systems Research Institute, Inc.\n' +
        '*   Apache License' +
        '*/\n\n',
        report: 'gzip'
      },
      compress: {
        files: {
          'dist/esri-leaflet.css': ['src/esri-leaflet.css']
        }
      }
    }
  });

  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('build', ['default', 'uglify', 'cssmin']);

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

};