import sys
import re


def get_values(data):
    times = re.findall("run [0-9]+ SaaSRequest residence times\": \"[^\"]*", data)
    m = {}
    for t in times:
        index = t[4:t.index(" SaaSRequest")]
        values = t[t.index("times\": \"") + 9:-1]
        values = list(map(lambda x: float(x), values.split(" ")))
        m[index] = values
    return m


def mean(values):
    return sum(values)/len(values)

def median(values):
    index = int(len(values)/2)
    return sorted(values)[index]






# main
print(sys.argv)
data = open(sys.argv[1])

v = get_values(data.read())

for index in range(1,len(v)+1):
    print("run: " + str(index))
    values = v[str(index)]
    print("mean: " + str(mean(values)))
    print("median: " + str(median(values)))