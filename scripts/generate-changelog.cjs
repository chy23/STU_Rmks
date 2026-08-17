const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Get all commits to keep full history as requested
  const logOutput = execSync('git log --pretty=format:"%H|%s|%b|%cd" --date=short').toString();
  
  const commits = logOutput.split('\n').filter(line => line.trim() !== '').map(line => {
    const parts = line.split('|');
    return {
      hash: parts[0],
      title: parts[1] || '',
      body: parts[2] || '',
      date: parts[3] || ''
    };
  });

  // Calculate version numbers based on total commit count
  const totalCommits = parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10);
  
  const changelog = commits.map((c, index) => {
    return {
      version: `v1.0.${totalCommits - index}`,
      date: c.date,
      title: c.title,
      details: c.body,
      hash: c.hash.substring(0, 7)
    };
  });

  const targetPath = path.join(__dirname, '../src/changelog.json');
  fs.writeFileSync(targetPath, JSON.stringify(changelog, null, 2));
  console.log('Changelog generated successfully at ' + targetPath);
} catch (e) {
  console.error('Failed to generate changelog:', e);
}
