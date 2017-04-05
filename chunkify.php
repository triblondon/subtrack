<?php

$content = file_get_contents('./talks/20170225-tokyo.txt');
$content = preg_replace("/\r*\n\r*/", "\n", $content);

$maxchunklength = 300;

$chunks = array();

while ($content) {

	// Try for full paragraphs
	if (preg_match("/^.{1,".$maxchunklength."}?(\n|\Z)/si", $content, $m) or
		preg_match("/^.{1,".$maxchunklength."}?\.\s+/si", $content, $m) or
		preg_match("/^.{1,".$maxchunklength."}?,\s+/si", $content, $m)) {
		$chunks[] = trim($m[0]);
		$content = trim(substr($content, strlen($m[0])));
	} else {
		echo "No match found: '".$content."'\n";
		break;
	}
}

foreach ($chunks as $str) {
	echo $str . "\n";
}
