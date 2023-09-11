from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from . import Generator as Mg
import json


MESH_GENERATOR = Mg.Generator()


def home(request):
    return render(request, 'frontend.html')


@csrf_exempt
def receive_points(request):
    if request.method == 'POST':
        data = json.loads(request.body.decode('utf-8'))
        points = data.get('points', [])
        all_points = []
        for point in points:
            all_points.append((point['x'], point['y']))
        MESH_GENERATOR.clear()
        MESH_GENERATOR.set_points(all_points)
        print(all_points)
        return JsonResponse({"status": "success"})


@csrf_exempt
def receive_data(request):
    MESH_GENERATOR.reconstruct()
    points = MESH_GENERATOR.get_points()
    lines = MESH_GENERATOR.get_edges()
    return JsonResponse({
        'points': [{'x': x, 'y': y} for x, y in points],
        'lines': [{'start': {'x': x1, 'y': y1}, 'end': {'x': x2, 'y': y2}} for (x1, y1), (x2, y2) in lines]
    })
