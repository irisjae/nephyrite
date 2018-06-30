#!/usr/bin/env bash
[[ `uname` == 'Darwin' ]] && { [ -d "/usr/local/opt/coreutils/libexec/gnubin" ] || { echo "gnu tools not found"; exit 1; } && PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH"; }
cd "$(dirname "$0")"
package_root="$(git rev-parse --show-toplevel)"

[ -d "${package_root}/dist/cordova/$" ] || {
	echo "dist/cordova/$ doesn't exist"
	exit 1
} && . ./_$.sh || {
	echo "cordova/android failed"
	exit 1
}
