require 'yaml'
require 'haml'
require 'uri'

def listing(folder=".", &block)
  folder << "/" unless folder.end_with? "/"
  
  abs_folder = if folder.start_with? "/"
    File.dirname(__FILE__).sub(/\/$/, '') + folder
  else
    dir = File.directory?(path) ? path : File.dirname(path)
    dir.sub(/\/$/, '') + '/' + folder
  end

  context = Object.new
  context.define_singleton_method :relative_url do |url|
    URI(url).relative? ? "#{folder}#{url}" : url
  end

  folder << "/" unless folder.end_with? "/"
  items = YAML.load_file("#{abs_folder}listing.yml")
  haml = <<~HAML
    %ul.listing
      - items.each do |item|
        %li
          %a{href: relative_url(item['url'])}= item['name']
          —
          = item['desc']
      - unless block.nil?
        - capture_haml(block)
  HAML
  Haml::Engine.new(haml).to_html context, items: items
end