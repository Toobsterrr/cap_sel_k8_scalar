import sys
import re



# convert durations to milli seconds
def nano_to_milli(value):
    l = len(value)
    if l < 7:
        return '0.' + "{:0>6}".format(value)
    return value[0:l-6] + '.' + value[l-6:]


# return: [(duration, status)]
def get_values(data):
    res = re.findall("duration - ([0-9]+)\n.*\n.*\n.*\n.*result - (failed|successful)", data)
    res = list(map(lambda x: (nano_to_milli(x[0]), x[1]), res))
    return res

# return latencies of values
def get_latencies(values):
    return list(map(lambda x: x[0], values))

# return status of values
def get_status(values):
    return list(map(lambda x: x[1], values))

# return the succesfull values
def get_successes(values):
    return list(filter(lambda x: x[1] == "successful", values))

# return the failed values
def get_failures(values):
    return list(filter(lambda x: x[1] == "failed", values))
    


def mean(latencies):
    return sum(latencies)/len(latencies)

def median(latencies):
    index = int(len(latencies)/2)
    return sorted(latencies)[index]


def save(filename, data):
    with open(filename, "w") as f:
        f.write("\n".join(data))








# main
print(sys.argv)

# read input file
with open(sys.argv[1]) as f:
    data = f.read()

# parse values
values = get_values(data)

successes = get_successes(values)
failures = get_failures(values)


save("success.dat", get_latencies(successes))
save("failed.dat", get_latencies(failures))

latencies = list(map(lambda x: float(x), get_latencies(successes)))

print("mean: " + str(mean(latencies)))
print("median: " + str(median(latencies)))

