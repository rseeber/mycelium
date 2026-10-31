#!/bin/env python3

import sys, random
from filelock import FileLock

programName = "create_invites.py"
filename = "data/invites.txt"

def create_invites(num: int):
    """
    Returns a list of random invite codes
    """
    li = list()
    for i in range(num):
        code = random.randint(0, 1_000_000_000)
        li.append(str(code))
    return li

def save_invites(num: int):
    """
    Calls `create_invites()` to generate random invite
    codes, and then appends those codes to `invites.txt`
    """
    new_invites = create_invites(num)

    # Use filelock to prevent race conditions while editing the file
    with FileLock(filename, timeout=10):
        # This should have the same effect as appending,
        # but without weird missing or extra newlines
        with open(filename, "r") as f:
            # merge the old list with the new list
            old_invites = f.read().split("\n")
        invites = old_invites + new_invites
        txt = "\n".join(invites)
        # now write the whole thing back to the file
        with open(filename, "w") as f:
            f.write(txt)


def consume_invite_code(code: int)-> bool:
    """
    Reads `invites.txt`. If `code` is present within the
    file, it removes it from the file and returns `True`.

    Otherwise, it returns `False`, leaving the file unchanged.
    """
    try:
        code = int(code)
    except ValueError:
        return False
    # Use filelock to prevent race conditions while editing the file
    with FileLock(filename, timeout=10):
        # read the invites
        with open(filename, "r") as f:
            invites: list[str] = f.read().split("\n")
            # keep this inside the 'with' block so that
            # it blocks the file from being opened by
            # a different thread
            # (not currently an issue, but planning for
            # the future and whatnot)
        # check if the code is in the invites
        found = False
        # iterate through each invite line
        print(f"Looking for {code}")
        print(f"type = {type(code)}")
        for line in invites:
            # remove the comments:
            # "123 # foo" becomes "123 "
            line_code = line
            i = line.find("#")
            if i >= 0:
                line_code = line[:i]
                print(f"Converting '{line}' to '{line_code}'")
            # non-numeric lines (including empty lines)
            try:
                line_code = int(line_code)
            except ValueError:
                continue
            print(f"line_code = {line_code}; {line_code} == {code}: {line_code == code}")
            # convert to int, and check for equality with the given code
            if line_code == code:
                print("Found!!")
                invites.remove(line)
                found = True
                break
        if not found:
            return False
        # save the file after having removed that code
        txt = "\n".join(invites)
        with open(filename, "w") as f:
            f.write(txt)
        return True

def main():
    try:
        num = int(sys.argv[1])
        assert(num > 0)
    except IndexError:
        print(f"Usage: {programName} <count>")
        exit(1)
    except ValueError:
        print(f"Usage: {programName} <count>")
        print("Error: <count> must be a valid integer")
        exit(1)
    except AssertionError:
        print(f"Usage: {programName} <count>")
        print("Error: <count> must be a positive number")
        exit(1)

    save_invites(num)



if __name__ == "__main__":
    main()