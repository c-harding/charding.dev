#!/usr/bin/env ruby
require 'sassc'

require_relative 'write_if_changed'

processed = []

def parse_sass(input, output)
  sass = File.read(input)
  css = SassC::Engine.new(sass, style: :compressed).render

  write_if_changed(output, css, log: true)
end

def parse(input)
  output, extension = input.match(/^(.+)\.([^\.]*)$/).captures
  case extension
  when "scss", "sass"
    parse_sass input, output
  when "css", "map"
    return
  else
    STDERR.puts "Unable to compile #{input}: unrecogmised extension"
  end
  parse output
end

def files(&block)
  if ARGV.empty?
    Dir.glob 'src/**/*.css.*' do |path|
      block[path]
    end
  else
    Dir.glob ARGV do |path|
      if path.match? /\.css\.(.*)$/
        block[path]
      else
        STDERR.puts "Not a CSS file: #{path}"
      end
    end
  end
end

files do |path|
  parse path
end
