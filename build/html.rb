#!/usr/bin/env ruby
require 'haml'

require_relative '../site.rb'
require_relative 'write_if_changed'

class Page
  def initialize(haml, output)
    @regions = {}
    @overwritten_regions = []
    @unused_regions = []
    @output = output
    @content = Haml::Engine.new(haml).to_html(self)
  end

  def content_for region
    @overwritten_regions << region if @regions.key? region
    @regions[region] = capture_haml { yield }
    @unused_regions << region
  end

  def [](region)
    @unused_regions.delete region
    @regions[region]
  end

  def path
    @output.sub(/(^|\/)index\.html$/, '\1')
  end

  def parent
    path.sub(/[^\/]*\/?$/, "")
  end

  def link_to(url, classes=[])
    if url == "/"
      return {href: url, class: [("this" if "/#{path}" == "/")] + classes}
    else
      return {href: url, class: [("this" if "/#{path}".start_with? url)] + classes}
    end
  end

  def to_html(template)
    begin
      html = template.to_html self do |region|
        if region.nil?
          @content
        else
          self[region] ? capture_haml { self[region] } : nil
        end
      end
    rescue NameError => e
      raise e
      raise NameError.new("File #{@output} contains a reference to the unknown variable #{e.name}.", e.name)
    end
    unless @overwritten_regions.empty?
      STDERR.puts "The following regions were overwritten: #{@overwritten_regions.join ", "}"
    end
    unless @unused_regions.empty?
      STDERR.puts "The following regions were never used: #{@unused_regions.join ", "}"
    end
    html
  end
end

class HamlParser
  def initialize(template_path)
    @template_path = template_path
    @template = Haml::Engine.new(File.read(@template_path))

    @@singleton = self
  end

  def self.parse(*args)
    @@singleton.parse(*args)
  end

  def parse(input, output)
    begin
      page = Page.new(File.read(input), output).to_html(@template)

      write_if_changed(output, page, log: true)
    rescue => error
      STDERR.puts "Cannot process #{input}"

      STDERR.puts error.backtrace if ENV["DEBUG"]

      STDERR.puts $!
    end
  end
end

def build_redirect(input, output)
  redirect, title = File.readlines(input)
  html = <<~HTML
    <!DOCTYPE html>
    <html><head>
        <meta http-equiv="refresh" content="0; url=#{redirect}" />
        <title>#{title}</title>
    </head><body></body></html>
  HTML
  write_if_changed(output, html, log: true)
end

HamlParser.new "template.haml"

def parse(input)
  output, extension = input.match(/^(.+)\.([^\.]*)$/).captures
  case extension
  when "haml"
    HamlParser.parse input, output
  when "html"
    return
  when "redirect"
    build_redirect input, output
  else
    STDERR.puts "Unable to compile #{input}: unrecogmised extension"
  end
  parse output
end

def files(&block)
  if ARGV.empty?
    Dir.glob 'src/**/*.html.*' do |path|
      block[path]
    end
  else
    Dir.glob ARGV do |path|
      if path.match? /\.html\.(.*)$/
        block[path]
      else
        STDERR.puts "Not an HTML file: #{path}"
      end
    end
  end
end

files do |input|
  parse input
end
