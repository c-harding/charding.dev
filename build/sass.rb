#!/usr/bin/env ruby

def sass_files(&block)
  if ARGV.empty?
    Dir.glob '**/*.{sass,scss}' do |source|
      block[source, source.sub(/\.s[ac]ss$/, '.css')]
    end
  else
    Dir.glob ARGV do |source|
      if source.match? /\.s[ac]ss$/
        block[source, source.sub(/\.s[ac]ss$/, '.css')]
      else
        STDERR.puts "Not an SASS/SCSS file: #{source}"
      end
    end
  end
end

processed = []

sass_files do |source, output|
  result = system('sass', source, output)
  raise result unless $?.to_i == 0
  raise "When compiled the module should output some CSS" unless File.exists?(output)
  processed << source
end

if processed.empty?
  puts "No SCSS to build"
else
  puts "Built CSS from #{processed.join ", "}"
end
