#!/usr/bin/env ruby

require 'date'
require 'shellwords'

require_relative 'write_if_changed'

class Entry
  def initialize(path, time)
    @path = path
    @time = time
  end

  attr_reader :path

  def to_xml
    <<~XML
      <url>
        <loc>#{@path}</loc>
        <lastmod>#{@time}</lastmod>
      </url>
    XML
  end
end

def to_xml entries
  <<~XML
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
    #{entries.map{|entry| entry.to_xml}.join ""}
    </urlset>
  XML
end

def strip_suffixes(filename)
  File.join(File.dirname(filename), File.basename(filename).sub(/(?<=\.html)\..+$/, ''))
end

fqdn = ARGV[0]

begin
  fqdn ||= "https://#{File.read('src/CNAME').strip}/"
rescue Error::ENOENT
end

unless fqdn
  STDERR.puts 'Please provide the path to your site as an argument, such as '+
              'http://user.github.io/project/, as an argument, or create a '+
              'CNAME file at the root of your project.'
  exit 1
end

urlset = []

Dir.glob 'src/**/*.html{,.*}' do |input|
  path = fqdn + strip_suffixes(input)
  next if urlset.any? {|x| path == x.path }
  date = `git log -1 --format=%cI #{input.shellescape}`.strip
  urlset << Entry.new(path, date)
end

sitemap_path = 'sitemap.xml'

write_if_changed(sitemap_path, to_xml(urlset), log: true)
