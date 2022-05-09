require 'digest'

def write_if_changed(file, output, log: false)
  begin
    previous_digest = Digest::SHA256.file(file).digest
  rescue Errno::ENOENT # File does not exist yet
    file_changed = true
  else
    new_digest = Digest::SHA256.digest(output)
    file_changed = previous_digest == new_digest
  end

  File.write(file, output)
  if file_changed
    puts "Unchanged:     #{file}" if log
    return false
  else
    puts "Changes saved: #{file}" if log
    return true
  end
end
