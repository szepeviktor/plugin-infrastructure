const github = require('@actions/github');
const fs = require('fs');

const filename = process.argv[2] || 'readme.md';
const myToken = process.env.TOKEN;

async function run() {
	const api = new github.GitHub(myToken);

	const { data: releases } = await api.repos.listReleases( github.context.repo );

	let published = releases.filter( release =>
		! release.draft && ! release.prerelease
	);

	let sorted = published.sort( ( a, b ) =>
		new Date( b.published_at ) - new Date( a.published_at )
	);

	let changelog = sorted.map( ( release ) => {
		const date = new Date( release.published_at ).toLocaleDateString(
			'en-gb',
			{
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			}
		);

		return [
			`### ${release.tag_name} (${date}) ###`,
			'',
			`${release.body}`,
		].join('\n');
	} );

	// Show a maximum of 15 releases
	changelog = changelog.slice( 0, 15 );

	changelog.push(
		'### Earlier versions ###',
		`For the changelog of earlier versions, <a href="https://github.com/${github.context.repo.owner}/${github.context.repo.repo}/releases">please refer to the releases page on GitHub</a>.`,
	);
	changelog.unshift('## Changelog ##');

	// Append the changelog
	try {
		fs.appendFileSync( filename, '\n' + changelog.join( '\n\n' ) );
	} catch ( exception ) {
		console.error( exception );
		process.exitCode = 1;
	}
}

run();
