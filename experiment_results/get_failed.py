import re
import sys


print(sys.argv)
data = open(sys.argv[1])

data = data.read()


# m = re.findall("result - \(\(failed\)|\(successfull\)\)", data)
m = re.findall("result - (?:failed|successful)", data)
for v in m:
    print(v)