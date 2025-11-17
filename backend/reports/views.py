from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from users.views import IsAdmin
from django.db.models import Sum, Avg, Q, ExpressionWrapper, F, FloatField, Case, When, Value
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from centers.models import Center
from users.models import User
from .models import Enrollment, Course
from .serializers import EnrollmentSerializer, CompletionRateSerializer, CourseDistributionSerializer

class ReportsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdmin]

    def get(self, request):
        period = request.query_params.get('period', 'monthly')
        center_id = request.query_params.get('center', 'all')  # Changed to center_id for filtering

        # Base queryset for centers
        centers_qs = Center.objects.all()
        if center_id != 'all':
            centers_qs = centers_qs.filter(id=center_id)  # Assume center is ID; adjust if name

        # Determine date range based on period
        today = datetime.now().date()
        if period == 'weekly':
            start_date = today - timedelta(days=7*6)  # Last 6 weeks
        elif period == 'quarterly':
            start_date = today - relativedelta(months=3)
        elif period == 'yearly':
            start_date = today - relativedelta(years=1)
        else:  # monthly default
            start_date = today - relativedelta(months=6)  # Last 6 months

        # Enrollment Trends: Filter and serialize
        enroll_qs = Enrollment.objects.filter(month__gte=start_date)
        if center_id != 'all':
            enroll_qs = enroll_qs.filter(center_id=center_id)
        enrollment_trends = EnrollmentSerializer(enroll_qs.order_by('month'), many=True).data

        # Completion Rates: Average per center
        completion_rates = []
        for center in centers_qs:
            center_enroll = enroll_qs.filter(center=center)
            avg_rate = center_enroll.annotate(
                rate=Case(
                    When(students=0, then=Value(0.0)),
                    default=ExpressionWrapper(F('completed_students') * 100.0 / F('students'), output_field=FloatField())
                )
            ).aggregate(avg_rate=Avg('rate'))['avg_rate'] or 0
            completion_rates.append({'center': center.name, 'rate': int(avg_rate)})
        completion_rates = CompletionRateSerializer(completion_rates, many=True).data

        # Course Distribution: Aggregate students per course type
        course_qs = Course.objects.filter(center__in=centers_qs)
        course_dist = course_qs.values('name').annotate(value=Sum('students'))
        colors = ['#16a34a', '#eab308', '#38bdf8', '#365314', '#6b7280']  # Cycle colors
        for i, item in enumerate(course_dist):
            item['color'] = colors[i % len(colors)]
        course_distribution = CourseDistributionSerializer(course_dist, many=True).data

        # Key Metrics
        active_centers = centers_qs.count()
        total_active_students = centers_qs.aggregate(total=Sum('students'))['total'] or 0
        total_instructors = User.objects.filter(role='instructor', center__in=centers_qs).count()
        overall_completion_rate = enroll_qs.annotate(
            rate=Case(
                When(students=0, then=Value(0.0)),
                default=ExpressionWrapper(F('completed_students') * 100.0 / F('students'), output_field=FloatField())
            )
        ).aggregate(avg=Avg('rate'))['avg'] or 0

        # Trends: Compare to previous period (placeholder logic; adjust)
        prev_start = start_date - (today - start_date)  # Rough previous period
        prev_enroll = Enrollment.objects.filter(month__gte=prev_start, month__lt=start_date)
        prev_students = prev_enroll.aggregate(total=Sum('students'))['total'] or 0
        current_students = enroll_qs.aggregate(total=Sum('students'))['total'] or 0
        trends = {
            'completion': round((overall_completion_rate - 80) or 5),  # Placeholder diff
            'students': round((current_students - prev_students) / prev_students * 100) if prev_students > 0 else 0,
            'instructors': 8,  # Placeholder
            'centers': active_centers - 40,  # Placeholder new centers
        }

        data = {
            'enrollment_trends': enrollment_trends,
            'completion_rates': completion_rates,
            'course_distribution': course_distribution,
            'key_metrics': {
                'overall_completion_rate': round(overall_completion_rate),
                'total_active_students': total_active_students,
                'total_instructors': total_instructors,
                'active_centers': active_centers,
                'trends': trends,
            }
        }
        return Response(data)