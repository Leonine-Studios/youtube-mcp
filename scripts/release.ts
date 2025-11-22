import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function run(command: string) {
    console.log(`> ${command}`);
    execSync(command, { stdio: 'inherit' });
}

try {
    // 1. Bump version in package.json without git commit/tag
    console.log('Bumping package version...');
    run('npm version patch --no-git-tag-version');

    // 2. Get new version from package.json
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    const newVersion = packageJson.version;
    console.log(`New version: ${newVersion}`);

    // 3. Sync version file
    const serverUtilsPath = path.join(__dirname, '..', 'src', 'server-utils.ts');

    // Update src/server-utils.ts
    console.log(`Updating ${serverUtilsPath}...`);
    let serverUtilsContent = fs.readFileSync(serverUtilsPath, 'utf8');
    const serverUtilsRegex = /(const packageVersion =\s*['"])\d+\.\d+\.\d+(['"])/;
    if (serverUtilsRegex.test(serverUtilsContent)) {
        serverUtilsContent = serverUtilsContent.replace(serverUtilsRegex, `$1${newVersion}$2`);
        fs.writeFileSync(serverUtilsPath, serverUtilsContent);
    } else {
        console.error(`Could not find version pattern in ${serverUtilsPath}`);
        process.exit(1);
    }

    // 4. Git commit and tag
    console.log('Committing and tagging...');
    // Stage package.json (and lockfile if it exists), and the source files
    run(`git add package.json package-lock.json src/server-utils.ts`);
    run(`git commit -m "chore: bump version to ${newVersion}"`);
    run(`git tag v${newVersion}`);

    // 5. Push
    console.log('Pushing to remote...');
    run('git push');
    run('git push --tags');

    console.log('Release completed successfully!');
} catch (error: any) {
    console.error('Release failed:', error.message);
    process.exit(1);
}
