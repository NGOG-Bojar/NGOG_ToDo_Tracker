import React from 'react';
import ReactECharts from 'echarts-for-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { useTask } from '../contexts/TaskContext';

function TaskCompletionStats() {
  const { tasks } = useTask();

  // Calculate completion rate
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Get tasks completed this week
  const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  const endOfThisWeek = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: startOfThisWeek, end: endOfThisWeek });

  const dailyCompletions = weekDays.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return completedTasks.filter(task => 
      task.status === 'completed' && 
      task.createdAt.startsWith(dayStr)
    ).length;
  });

  // Priority distribution
  const priorityDistribution = {
    urgent: tasks.filter(task => task.priority === 'urgent').length,
    high: tasks.filter(task => task.priority === 'high').length,
    medium: tasks.filter(task => task.priority === 'medium').length,
    low: tasks.filter(task => task.priority === 'low').length
  };

  // Chart options
  const weeklyOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: weekDays.map(day => format(day, 'EEE')),
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: [{
      name: 'Tasks Completed',
      type: 'bar',
      data: dailyCompletions,
      itemStyle: {
        color: '#3B82F6'
      },
      emphasis: {
        itemStyle: {
          color: '#2563EB'
        }
      }
    }]
  };

  const priorityOption = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      bottom: '0%',
      left: 'center'
    },
    series: [{
      name: 'Priority Distribution',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '16',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { value: priorityDistribution.urgent, name: 'Urgent', itemStyle: { color: '#DC2626' } }, // Changed to bright red
        { value: priorityDistribution.high, name: 'High', itemStyle: { color: '#EF4444' } },
        { value: priorityDistribution.medium, name: 'Medium', itemStyle: { color: '#F59E0B' } },
        { value: priorityDistribution.low, name: 'Low', itemStyle: { color: '#10B981' } }
      ]
    }]
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Completion Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Task Completion</h3>
        <ReactECharts option={weeklyOption} style={{ height: '300px' }} />
      </div>

      {/* Priority Distribution Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Priority Distribution</h3>
        <ReactECharts option={priorityOption} style={{ height: '300px' }} />
      </div>
    </div>
  );
}

export default TaskCompletionStats;