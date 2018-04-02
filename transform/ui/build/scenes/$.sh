#!/usr/bin/env bash
[[ `uname` == 'Darwin' ]] && { [ -d "/usr/local/opt/coreutils/libexec/gnubin" ] || { echo "gnu tools not found"; exit 1; } && PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH"; }
cd "$(dirname "$0")"
package_root="$(git rev-parse --show-toplevel)"

. ~/.nvm/nvm.sh --no-use
nvm use 8 > /dev/null
[[ "$(node --version)" == "v8"* ]] || {
	echo "couldn't change to node v8"
	exit 1
} && [ -d "${package_root}/src/ui/scenes" ] || {
	echo "src/ui/scenes doesn't exist"
	exit 1
} && node $TRANSFORM_OPTIONS "$.js" || {
	echo "ui/scenes failed"
	exit 1
}
