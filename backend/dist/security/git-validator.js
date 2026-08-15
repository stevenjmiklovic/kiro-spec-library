// Git command validation — reject dangerous args, shell metacharacters
import { FORBIDDEN_GIT_ARGS } from "@kiro-spec-library/shared";
const ok = { valid: true };
const reject = (reason) => ({ valid: false, reason });
/** Characters that could trigger shell injection if args are naively interpolated */
const SHELL_METACHARACTERS = /[;&|`$(){}!<>\\'"*?\[\]\n\r]/;
/**
 * Validate git command arguments.
 * Rejects forbidden flags and shell metacharacters.
 */
export function validateArgs(args) {
    for (const arg of args) {
        // Check forbidden args
        const lowerArg = arg.toLowerCase();
        for (const forbidden of FORBIDDEN_GIT_ARGS) {
            if (lowerArg === forbidden || lowerArg.startsWith(forbidden + "=")) {
                return reject(`Forbidden git argument: ${arg}`);
            }
        }
        // Check shell metacharacters
        if (SHELL_METACHARACTERS.test(arg)) {
            return reject(`Git argument contains shell metacharacters: ${arg}`);
        }
    }
    return ok;
}
/**
 * Build a safe git fetch command array for a clone path and branch.
 * Always disables hooks, uses --no-tags, and limits depth.
 */
export function buildFetchCommand(clonePath, branch) {
    // Validate inputs
    const argsCheck = validateArgs([clonePath, branch]);
    if (!argsCheck.valid) {
        throw new Error(`Invalid fetch arguments: ${argsCheck.reason}`);
    }
    return [
        "git",
        "-C",
        clonePath,
        "-c",
        "core.hooksPath=/dev/null",
        "fetch",
        "--no-tags",
        "--depth=1",
        "--no-recurse-submodules",
        "origin",
        branch,
    ];
}
/**
 * Build a safe git clone command array for a URL and destination.
 */
export function buildCloneCommand(url, destination, branch) {
    // Validate inputs
    const argsCheck = validateArgs([url, destination, branch]);
    if (!argsCheck.valid) {
        throw new Error(`Invalid clone arguments: ${argsCheck.reason}`);
    }
    return [
        "git",
        "clone",
        "-c",
        "core.hooksPath=/dev/null",
        "--no-tags",
        "--depth=1",
        "--single-branch",
        "--branch",
        branch,
        "--no-recurse-submodules",
        url,
        destination,
    ];
}
