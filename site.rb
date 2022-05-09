require 'yaml'
require 'haml'
require 'uri'

def listing(link=nil, &block)
  src_folder = File.join(File.dirname(__FILE__), 'src')
  if link&.start_with? "/"
    folder = File.join(src_folder, link)
  else
    base_path = File.join(src_folder, path)
    base_path = File.dirname(base_path) unless File.directory?(base_path)
    folder = File.join(base_path, link || '')
  end

  context = Object.new
  context.define_singleton_method :relative_url do |url|
    URI(url).relative? ? "#{folder}#{url}" : url
  end

  items = YAML.load_file(File.join(folder, "listing.yml"))
  link = nil if Dir.glob(File.join(folder, "index.html.*")).empty?
  if link.nil?
    filtered_items = items
  else
    filtered_items = items.filter {|item| item['homepage']}
    link = nil unless filtered_items.size < items.size
  end
  haml = <<~HAML
    %ul.listing
      - items.each do |item|
        %li
          %a{href: relative_url(item['url'])}= item['name']
          —
          = item['desc']
      - if link
        %li
          %a{href: link} See all…
  HAML
  Haml::Engine.new(haml).to_html context, items: filtered_items, link: link
end
