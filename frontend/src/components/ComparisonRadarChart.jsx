import React from 'react';
import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

/**
 * 多候选人对比雷达图组件
 * @param {Array} candidates - 候选人数组，每个候选人包含 name 和 assessment 数据
 */
function ComparisonRadarChart({ candidates }) {
  if (!candidates || candidates.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>暂无候选人数据</div>;
  }

  // 颜色方案 - 为不同候选人分配不同颜色
  const colors = [
    '#1890ff', // 蓝色
    '#52c41a', // 绿色
    '#faad14', // 橙色
    '#f5222d', // 红色
    '#722ed1', // 紫色
    '#13c2c2', // 青色
    '#eb2f96', // 粉色
    '#fa8c16', // 橙红色
  ];

  // 能力维度定义
  const dimensions = [
    { key: 'technical_match', label: '技术匹配度' },
    { key: 'experience_match', label: '经验匹配度' },
    { key: 'cultural_fit', label: '文化契合度' },
    { key: 'growth_potential', label: '成长潜力' },
    { key: 'stability', label: '职业稳定性' }
  ];

  // 转换数据格式为 recharts 需要的格式
  const chartData = dimensions.map(dim => {
    const dataPoint = {
      subject: dim.label,
      fullMark: 100
    };

    // 为每个候选人添加对应维度的数据
    candidates.forEach((candidate, index) => {
      if (index < 8) { // 最多显示8个候选人
        const candidateName = candidate.name || `候选人${index + 1}`;
        dataPoint[candidateName] = candidate.assessment?.[dim.key] || 0;
      }
    });

    return dataPoint;
  });

  return (
    <ResponsiveContainer width="100%" height={500}>
      <RechartsRadar data={chartData}>
        <PolarGrid />
        <PolarAngleAxis
          dataKey="subject"
          style={{ fontSize: 13, fill: '#666' }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          style={{ fontSize: 11 }}
        />

        {/* 为每个候选人绘制一条雷达线 */}
        {candidates.slice(0, 8).map((candidate, index) => {
          const candidateName = candidate.name || `候选人${index + 1}`;
          return (
            <Radar
              key={index}
              name={candidateName}
              dataKey={candidateName}
              stroke={colors[index]}
              fill={colors[index]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          );
        })}

        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '8px 12px'
          }}
        />

        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="line"
        />
      </RechartsRadar>
    </ResponsiveContainer>
  );
}

export default ComparisonRadarChart;
