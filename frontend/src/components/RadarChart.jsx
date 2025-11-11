import React from 'react';
import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

function RadarChart({ data }) {
  // 转换数据格式为recharts需要的格式
  const chartData = [
    { subject: '技术匹配度', A: data.technical_match || 0, fullMark: 100 },
    { subject: '经验匹配度', A: data.experience_match || 0, fullMark: 100 },
    { subject: '文化契合度', A: data.cultural_fit || 0, fullMark: 100 },
    { subject: '成长潜力', A: data.growth_potential || 0, fullMark: 100 },
    { subject: '职业稳定性', A: data.stability || 0, fullMark: 100 }
  ];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsRadar>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} />
        <Radar
          name="候选人评估"
          dataKey="A"
          data={chartData}
          stroke="#1890ff"
          fill="#1890ff"
          fillOpacity={0.6}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  );
}

export default RadarChart;
