# -*- encoding: utf-8 -*-
# stub: haml-contrib 1.0.0.1 ruby lib

Gem::Specification.new do |s|
  s.name = "haml-contrib".freeze
  s.version = "1.0.0.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Norman Clarke".freeze]
  s.date = "2013-05-28"
  s.description = "Addons for the Ruby implementation of the Haml template language.".freeze
  s.email = ["norman@njclarke.com".freeze]
  s.homepage = "http://haml.info/".freeze
  s.licenses = ["MIT".freeze]
  s.rubygems_version = "3.2.32".freeze
  s.summary = "Addons to Haml".freeze

  s.installed_by_version = "3.2.32" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4
  end

  if s.respond_to? :add_runtime_dependency then
    s.add_runtime_dependency(%q<haml>.freeze, [">= 3.2.0.alpha.13"])
    s.add_development_dependency(%q<minitest>.freeze, [">= 0"])
  else
    s.add_dependency(%q<haml>.freeze, [">= 3.2.0.alpha.13"])
    s.add_dependency(%q<minitest>.freeze, [">= 0"])
  end
end
