import fs from 'fs';
import pg from 'pg';
import { parse } from 'json2csv';
import yaml from 'json-to-pretty-yaml';

const { Pool } = pg;
export const connection = new Pool({
    connectionString: 'postgres://postgres:123123@localhost:5432/repo_git',
});

async function getData() {
    const repos = await connection.query(`
        SELECT
            name, owner, description, topic, language, stars
        FROM repositories
        WHERE "hasSponsorship" = TRUE;
    `);

    return repos.rows;
}

async function getTypescriptRepos() {
    const repos = await connection.query(`
        SELECT
            "fullName" AS url, description, tags
        FROM repositories
        WHERE
            language = 'TypeScript'
        AND
            tags LIKE '%''react''%';
    `);

    return repos.rows;
}

async function writeFile(jsonData) {
    fs.writeFileSync('sponsored-repos.json', jsonData);
}

async function parse2Csv() {
    const fileData = JSON.parse(
        fs.readFileSync('sponsored-repos.json').toString()
    );

    const csvData = parse(fileData);

    fs.writeFileSync('most-famous-sponsored-repos.csv', csvData);
}

async function writeTypescriptReposFile() {
    const TypeScriptRepos = await getTypescriptRepos();

    const treatedData = TypeScriptRepos.map((repo) => {
        return {
            ...repo,
            url: `https://github.com/${repo.url}`,
        };
    });
    const jsonTypescriptData = JSON.stringify(treatedData);

    fs.writeFileSync('typescript-repos.json', jsonTypescriptData);
}

async function parse2Yaml() {
    const fileData = JSON.parse(
        fs.readFileSync('typescript-repos.json').toString()
    );
    const yamlData = yaml.stringify({ repositories: fileData });

    fs.writeFileSync('react-typescript-repos.yaml', yamlData);
}

const jsonData = JSON.stringify(await getData());

await writeFile(jsonData);
await parse2Csv();
await writeTypescriptReposFile();
await parse2Yaml();
