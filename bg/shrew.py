#!/usr/bin/python

__author__ = 'Zibx'
import sys
import os
import re
import shutil

debug = False

end_chars = re.compile('\r?\n\r?$')
empty_start = re.compile('^\s*')
var_regexp = re.compile('{(.*?)}')
current_line = 0
variables = {}


def filename_resolve(name):
    filename = os.path.normpath(os.path.join(root, name))

    if filename.startswith(root):
        if len(filename) > len(root):
            symbol = filename[len(root)]

            if symbol == '/' or symbol == '\\':
                return filename
        else:
            return filename

    print 'You should not try to get out of root directory. `'+filename+'` '+current_file+':'+str(current_line)
    return False


def get_variable_operation(token):
    return variables[token.group(1)]


def templater(data):
    return re.sub(var_regexp, get_variable_operation, data)


def touch_operation(data):
    filename = filename_resolve(data)
    if filename is not False:
        open(filename, 'a').close()


def print_operation(data):
    tokens = data.split(' ', 1)
    filename = filename_resolve(tokens[0])
    if filename is not False:
        with open(filename, 'a') as f:
            f.write(templater(tokens[1]))


def print_line_operation(data):
    print_operation(data + '\n')


def remove_operation(data):
    tokens = data.split(' ', 1)
    filename = filename_resolve(tokens[0])
    if filename is not False:
        if os.path.isfile(filename):
            os.remove(filename)
        elif os.path.isdir(filename):
            shutil.rmtree(filename)


def copy_operation(data):
    tokens = data.split(' ', 1)
    filename1 = filename_resolve(tokens[0])
    filename2 = filename_resolve(tokens[1])
    if filename1 is not False and filename2 is not False:
        if os.path.isfile(filename1):
            shutil.copyfile(filename1, filename2)
        elif os.path.isdir(filename1):
            shutil.copytree(filename1, filename2)


def let_operation(data):
    tokens = [x.strip(' ') for x in data.split('=', 1)]
    global variables
    variables[tokens[0]] = templater(tokens[1])


def include_operation(filename):
    if os.path.isfile(filename):
        with open(filename) as f:
            content = f.readlines()

        execute(content, filename)
    else:
        print 'Cannot find file `'+filename+'`'
        exit(1)


def echo_operation(data):
    print templater(data)


def tokenize(data):
    out = []
    word = ''
    in_brace = False
    brace_type = ''
    for m in data:
        if in_brace and m == brace_type:
            in_brace = False
            if word is not '':
                out.append(word)
            word = ''
        elif not in_brace and m == ' ':
            if word is not '':
                out.append(word)
            word = ''

        else:
            if not in_brace and (m == '"' or m == "'"):
                in_brace = True
                brace_type = m
            else:
                word += m

    if word is not '':
        out.append(word)

    return out


def psql_operation(data):
    tokens = tokenize(templater(data))

    for i in range(len(tokens)):
        token = tokens[i]
        if token == '-f':
            tokens[i+1] = filename_resolve(tokens[i+1])
            break
    os.system('psql '+' '.join(tokens))


def replace_operation(data):
    tokens = tokenize(data)
    filename = filename_resolve(tokens[0])
    write = True
    if os.path.isfile(filename):
        with open(filename) as f:
            content = f.read()
        if len(tokens) < 2:
            print 'You should specify replace pattern'
        else:
            print tokens[1]
            matches = re.search(tokens[1], content, flags=re.DOTALL)
            print matches
            submatch = ''
            if matches:
                matches = matches.regs[1:]
            while matches:
                match_count = len(matches)
                replace_count = len(tokens) - 2
                if match_count != replace_count:
                    print 'There are ' +\
                          ('only ' if match_count > replace_count else '') +\
                          str(match_count)+' '+('matches' if match_count > 1 else 'match')+', but you gave ' +\
                          ('only ' if match_count > replace_count else '') +\
                          str(replace_count)+' '+('replaces' if match_count > 1 else 'replace')
                    return
                else:

                    for i in reversed(range(len(matches))):
                        start = matches[i][0]
                        end = matches[i][1]

                        content = content[0:start]+templater(tokens[2+i])+content[end:]
                    max = matches[len(matches)-1][1]
                    submatch += content[:max]
                    content = content[max:]
                matches = re.search(tokens[1], content)
                if matches:
                    matches = matches.regs[1:]

            submatch += content
            if write:
                with open(filename, 'w') as f:
                    f.write(submatch)
    else:
        print 'Replace comand could not find file `'+filename+'`'




functions = {
    'touch': touch_operation,
    'print': print_operation,
    'printLine': print_line_operation,
    'remove': remove_operation,
    'copy': copy_operation,
    'let': let_operation,
    'include': include_operation,
    'echo': echo_operation,
    'replace': replace_operation,
    'psql': psql_operation
}


args = sys.argv[1:]
# args = ['shrew.cfg', './test', 'local=local.cfg']
if len(args) < 2:
    print 'shrew config_path root [expr1 expr2 .. expr n]'
    exit(1)
else:
    root = os.path.abspath(args[1])
    current_file = cfgName = args[0]
# print root


def execute(content, filename):
    global current_line, current_file

    line_number = 0
    while line_number < len(content):

        line = content[line_number]
        current_line = line_number
        current_file = filename

        line = re.sub(empty_start, '', re.sub(end_chars, '', line))
        tokens = line.split(' ', 1)
        if len(tokens[0].split('=')) > 1 or (len(tokens) > 1 and tokens[1].startswith('=')):
            tokens = ['let'] + [' '.join(tokens)]
        fn_name = tokens[0]
        if len(tokens) > 1:
            data = tokens[1]
        else:
            data = ''

        if fn_name is not '' and not fn_name.startswith('#'):
            if fn_name in functions:
                if debug:
                    print fn_name, '('+data+')'
                functions[fn_name](data)
            else:
                print 'Unknown function `'+fn_name+'`'
        line_number += 1


def main():
    # try:
    include_operation(cfgName)

    # except Exception as e:
    #     exit(e)
if len(args) >= 2:
    main()