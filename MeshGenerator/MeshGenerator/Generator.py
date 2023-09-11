from scipy.spatial import Delaunay


def distance(a, b):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5


class Curve:
    def __init__(self, head, tail):
        self.head = head
        self.tail = tail
        self.points = [head, tail]
        self.is_cyclic = False

    def add_head(self, point):
        self.points = [point] + self.points
        self.head = point

    def remove_head(self):
        if len(self.points) <= 2:
            return

        self.points = self.points[1:]
        self.head = self.points[0]

    def add_tail(self, point):
        self.points.append(point)
        self.tail = point

    def remove_tail(self):
        if len(self.points) <= 2:
            return

        self.points = self.points[:-1]
        self.tail = self.points[-1]

    def is_endpoint(self, point):
        if point == self.head or point == self.tail:
            return True
        return False

    def get_distance_mean(self):
        total = 0
        for i in range(len(self.points) - 1):
            total += distance(self.points[i], self.points[i + 1])
        return total / (len(self.points) - 1)

    def get_distance_deviation(self):
        if len(self.points) <= 2:
            return 0
        avg = self.get_distance_mean()
        total = 0
        for i in range(len(self.points) - 1):
            total += (distance(self.points[i], self.points[i + 1]) - avg) ** 2
        return (total / (len(self.points) - 2)) ** 0.5

    def calculate_connectivity(self, end_point, point):
        def e(x1, x2, xi):
            h = (distance(x1, x2) + distance(x2, xi)) / 2
            s = (abs(distance(x1, x2) - distance(x2, xi))) / 2 ** 0.5
            hd = self.get_distance_mean()
            od = self.get_distance_deviation()
            if od == 0:
                return hd * h / s
            return hd * (h / s) * (1 + hd / od) ** (od / hd)

        if end_point == self.head:
            return e(self.points[1], self.head, point)
        return e(self.points[-2], self.tail, point)

    def add_point(self, end_point, point):
        if end_point == self.head:
            self.add_head(point)
        else:
            self.add_tail(point)

    def merge(self, self_endpoint, other_endpoint, other):
        # Situation 1: self head connects with other tail
        if self_endpoint == self.head and other_endpoint == other.tail:
            self.head = other.head
            self.points = other.points + self.points  # Since no points are repeated, directly concatenate
        # Situation 2: self tail connects with other head
        elif self_endpoint == self.tail and other_endpoint == other.head:
            self.tail = other.tail
            self.points += other.points  # Directly concatenate
        # Situation 3: self head connects with other head
        elif self_endpoint == self.head and other_endpoint == other.head:
            self.head = other.tail
            self.points = list(reversed(other.points)) + self.points  # Reverse other's points and concatenate
        # Situation 4: self tail connects with other tail
        elif self_endpoint == self.tail and other_endpoint == other.tail:
            self.tail = other.head
            self.points += list(reversed(other.points))  # Reverse other's points and concatenate

    def get_edges(self):
        edges = []
        for i in range(len(self.points) - 1):
            edges.append((self.points[i], self.points[i + 1]))
        if self.is_cyclic:
            edges.append((self.points[-1], self.points[0]))
        return edges


class Generator:
    def __init__(self):
        self.points = []
        self.curves = []
        self.edges = []
        self.de_edges = []
        self.marks = {}
        self.degree = {}

    def calculate_delaunay(self):
        # 检查是否有足够的点进行三角剖分
        if len(self.points) < 3:
            print("Need at least 3 points for triangulation.")
            return

        # 使用scipy的Delaunay函数进行三角剖分
        tri = Delaunay(self.points)

        # 获取所有Delaunay三角形的顶点索引
        indices = tri.simplices

        # 存储所有Delaunay edges
        edges = set()

        for simplex in indices:
            # 每个单纯形（即，每个三角形）有3个边
            for i in range(3):
                edge = tuple(sorted([(self.points[simplex[i]][0], self.points[simplex[i]][1]),
                                     (self.points[simplex[(i + 1) % 3]][0], self.points[simplex[(i + 1) % 3]][1])]))
                edges.add(edge)

        self.de_edges = list(edges)

        for edge in self.de_edges:
            self.marks[edge] = 0
        for point in self.points:
            self.degree[point] = 0

    def determining_connectivity(self):
        sorted_de_edges = self.sorted_by_distance()
        for edge in sorted_de_edges:
            edge_length = distance(edge[0], edge[1])
            # both points are free point
            if self.marks[edge] == 0 and self.degree[edge[0]] == 0 and self.degree[edge[1]] == 0:
                self.degree[edge[0]] += 1
                self.degree[edge[1]] += 1
                self.marks[edge] = 1
                new_curve = Curve(edge[0], edge[1])
                self.curves.append(new_curve)
            else:
                if self.degree[edge[0]] > 1 or self.degree[edge[1]] > 1:
                    continue

                ptr1, ptr2 = None, None
                for cur in self.curves:
                    if ptr1 is not None and ptr2 is not None:
                        break
                    if cur.is_endpoint(edge[0]):
                        ptr1 = cur
                    if cur.is_endpoint(edge[1]):
                        ptr2 = cur

                # 首尾相连
                if ptr1 == ptr2:
                    if edge_length < max(ptr1.calculate_connectivity(edge[0], edge[1]),
                                         ptr1.calculate_connectivity(edge[1], edge[0])):
                        ptr1.is_cyclic = True
                        self.degree[edge[0]] += 1
                        self.degree[edge[1]] += 1
                    continue

                if ptr1 is None:
                    if edge_length < ptr2.calculate_connectivity(edge[1], edge[0]):
                        ptr2.add_point(edge[1], edge[0])
                        self.degree[edge[0]] += 1
                        self.degree[edge[1]] += 1
                    continue

                if ptr2 is None:
                    if edge_length < ptr1.calculate_connectivity(edge[0], edge[1]):
                        ptr1.add_point(edge[0], edge[1])
                        self.degree[edge[0]] += 1
                        self.degree[edge[1]] += 1
                    continue

                if edge_length < max(ptr1.calculate_connectivity(edge[0], edge[1]),
                                     ptr2.calculate_connectivity(edge[1], edge[0])):
                    ptr1.merge(edge[0], edge[1], ptr2)
                    self.degree[edge[0]] += 1
                    self.degree[edge[1]] += 1
                    self.curves.remove(ptr2)

    def reconstruct(self):
        self.calculate_delaunay()
        self.determining_connectivity()
        for curve in self.curves:
            self.edges += curve.get_edges()

    def set_points(self, points):
        self.points = points

    def get_points(self):
        return self.points[:]

    def get_edges(self):
        return self.edges[:]

    def sorted_by_distance(self):
        sorted_list = []
        for edge in self.de_edges:
            sorted_list.append((distance(edge[0], edge[1]), edge))

        sorted_list = sorted(sorted_list)
        return [comp[1] for comp in sorted_list]

    def clear(self):
        self.points = []
        self.curves = []
        self.edges = []
        self.de_edges = []
        self.marks = {}
        self.degree = {}


if __name__ == "__main__":
    generator = Generator()
    generator.points = [(16, 134), (62, 218), (91, 232), (201, 245), (295, 228), (309, 206), (320, 184)]
    generator.reconstruct()
    print(generator.get_edges())
