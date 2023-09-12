import math
from scipy.spatial import Delaunay


def distance(a, b):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5


def interior_angle(p1, p2, p3):
    # 计算p1, p2, p3形成的内角，返回角度（单位：度）
    vector1 = (p1[0] - p2[0], p1[1] - p2[1])
    vector2 = (p3[0] - p2[0], p3[1] - p2[1])
    dot_product = vector1[0] * vector2[0] + vector1[1] * vector2[1]
    magnitude1 = math.sqrt(vector1[0] ** 2 + vector1[1] ** 2)
    magnitude2 = math.sqrt(vector2[0] ** 2 + vector2[1] ** 2)
    angle = math.acos(dot_product / (magnitude1 * magnitude2))
    return math.degrees(angle)


class Curve:
    def __init__(self, head, tail):
        self.head = head
        self.tail = tail
        self.points = [head, tail]
        self.is_cyclic = False

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

    def _calculate_angles(self):
        angles = []
        for i in range(1, len(self.points) - 1):
            p1 = self.points[i - 1]
            p2 = self.points[i]
            p3 = self.points[i + 1]

            vector1 = (p1[0] - p2[0], p1[1] - p2[1])
            vector2 = (p3[0] - p2[0], p3[1] - p2[1])

            dot_product = vector1[0] * vector2[0] + vector1[1] * vector2[1]
            magnitude1 = math.sqrt(vector1[0] ** 2 + vector1[1] ** 2)
            magnitude2 = math.sqrt(vector2[0] ** 2 + vector2[1] ** 2)

            if magnitude1 * magnitude2 == 0:
                return "Cannot calculate angle due to zero magnitude vector."

            angle = math.acos(dot_product / (magnitude1 * magnitude2))
            angle_degree = math.degrees(angle)
            angles.append(angle_degree)

        return angles

    def get_angle_mean(self):
        angles = self._calculate_angles()
        if isinstance(angles, str):
            return angles

        return sum(angles) / len(angles)

    def get_angle_deviation(self):
        angles = self._calculate_angles()
        if isinstance(angles, str):
            return angles

        mean_angle = self.get_angle_mean()
        sum_of_squared_differences = sum((x - mean_angle) ** 2 for x in angles)
        standard_deviation = math.sqrt(sum_of_squared_differences / len(angles))

        return standard_deviation

    def calculate_connectivity(self, end_point, point, c):
        # Special case: If the curve has only two points
        if len(self.points) == 2:
            a_bar = 180  # Preset average angle (or any other logic)
            s = 1  # Preset standard deviation (or any other logic)
            as_ = 180  # Preset candidate angle (or any other logic)
        else:
            # Calculate candidate angle (as)
            as_ = interior_angle(self.points[-2], end_point, point) if end_point == self.tail else interior_angle(point,
                                                                                                                  end_point,
                                                                                                                  self.points[
                                                                                                                      1])
            # Calculate average angle (a_bar)
            a_bar = self.get_angle_mean()
            # Calculate standard deviation (s)
            s = self.get_distance_deviation()

        # Calculate the length of the candidate segment (ds)
        ds = distance(end_point, point)

        # Calculate mean distance (d_bar)
        d_bar = self.get_distance_mean()

        # Calculate E[p; Tp1] using the corrected formula
        E_value = (c * ((as_ / a_bar - 1) ** 2) + ((1 - c) / 4) * ((ds / (d_bar + s)) ** 2) + 1) ** -1

        return E_value

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
        sorted_de_edges = sorted(self.de_edges, key=lambda e: distance(e[0], e[1]))

        def calculate_radius(point, constant=1.0):
            # Find the shortest and second-shortest Delaunay edges connected to the given point
            shortest_edge = None
            second_shortest_edge = None

            for edge in sorted_de_edges:
                p1, p2 = edge
                if p1 == point or p2 == point:
                    if shortest_edge is None:
                        shortest_edge = edge
                    elif second_shortest_edge is None:
                        second_shortest_edge = edge
                        break

            if shortest_edge is None or second_shortest_edge is None:
                return None  # The point is not connected by at least two Delaunay edges

            # Calculate the lengths of the shortest and second-shortest edges
            shortest_length = distance(*shortest_edge)
            second_shortest_length = distance(*second_shortest_edge)

            # Calculate the radius
            radius = (shortest_length + second_shortest_length) / 2 * constant

            return radius

        def point_to_point(q1, q2):
            edges_to_q1 = [e for e in sorted_de_edges if q1 in e]
            if len(edges_to_q1) < 2:
                return False

            q1qk1 = edges_to_q1[0]
            q1qk2 = edges_to_q1[1]

            r = 0.5 * (distance(q1, q1qk1[0] if q1qk1[1] == q1 else q1qk1[1]) +
                       distance(q1, q1qk2[0] if q1qk2[1] == q1 else q1qk2[1]))

            points_in_B = [p for p in self.points if distance(p, q1) <= r]

            for qi in points_in_B:
                for qj in points_in_B:
                    for qt in points_in_B:
                        if qi != qj and qi != qt and qj != qt and q2 not in [qi, qj, qt]:
                            angle1 = interior_angle(qt, q1, qj)
                            angle2 = interior_angle(qi, q1, q2)
                            if angle1 < angle2:
                                return
            self.curves.append(Curve(q1, q2))

        def point_curve(point, curve, c=1.0):
            # Determine which endpoint is closer to the point
            distance_to_head = distance(point, curve.head)
            distance_to_tail = distance(point, curve.tail)

            closer_endpoint = curve.head if distance_to_head < distance_to_tail else curve.tail

            # Calculate the radius for the closer endpoint
            radius = calculate_radius(closer_endpoint)

            if radius is None:
                return False  # Cannot calculate radius, hence cannot proceed

            # Find points in the radius around the closer endpoint
            points_in_radius = [p for p in curve.points if distance(p, closer_endpoint) <= radius]

            # Calculate E values for the candidate point and other points in the radius
            E_candidate = curve.calculate_connectivity(closer_endpoint, point, c)
            E_values = [curve.calculate_connectivity(closer_endpoint, p, c) for p in points_in_radius]

            # Check if the candidate point should be connected to the curve
            if all(E_candidate >= E for E in E_values):
                curve.add_point(closer_endpoint, point)

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
