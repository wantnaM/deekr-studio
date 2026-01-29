import { CheckCircleFilled, UploadOutlined } from '@ant-design/icons'
import userDataService from '@renderer/services/UserDataService'
import request from '@renderer/utils/axios'
import type { GetProp, UploadFile, UploadProps } from 'antd'
import { Button, Col, Form, Input, message, Result, Row, Select, Space, Upload } from 'antd'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SettingContainer, SettingDivider, SettingGroup, SettingRow, SettingTitle } from '.'

const { Option } = Select
const { TextArea } = Input

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0]

const FeedbackForm: FC = () => {
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false) // 新增状态控制提交状态
  const { t } = useTranslation()
  const userId = userDataService.getCurrentUserId()

  const onFinish = async (values: any) => {
    const formData = new FormData()
    // 添加其他表单字段到FormData对象
    Object.keys(values).forEach((key) => {
      if (values[key] && key !== 'file') {
        formData.append(key, values[key])
      }
    })

    if (fileList && fileList.length > 0) {
      fileList.forEach((file) => {
        formData.append('files', file as FileType)
      })
    }

    formData.append('userId', String(userId))

    try {
      const res = await submitFeedback(formData)
      if (res) {
        setIsSubmitted(true) // 设置提交状态为true
      }
    } catch (error) {
      message.error('提交失败，请重试')
    }
  }

  const resetForm = () => {
    form.resetFields()
    setFileList([])
    setIsSubmitted(false) // 重置提交状态
  }

  const submitFeedback = async (data: any) => {
    return await request.post({
      url: `/ds/feedback/create`,
      data,
      headers: {
        'Content-Type': 'multipart/form-data' // 确保设置正确的Content-Type
      }
    })
  }

  const uploadProps: UploadProps = {
    name: 'file',
    headers: {
      authorization: 'authorization-text'
    },
    fileList: fileList,
    beforeUpload: (file) => {
      if (fileList.length >= 2) {
        message.error('最多只能上传2个文件!')
        return Upload.LIST_IGNORE
      }

      // 允许的文件类型：图片 + 常见文档格式
      const allowedTypes = [
        'image/',
        'text/plain', // .txt
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/pdf' // .pdf
      ]

      const isAllowed = allowedTypes.some((type) => file.type.startsWith(type) || file.type === type)

      if (!isAllowed) {
        message.error('只能上传图片或文档文件 (JPG/PNG/TXT/DOC/DOCX/PDF)!')
        return Upload.LIST_IGNORE
      }

      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        message.error('文件大小必须小于 10MB!')
        return Upload.LIST_IGNORE
      }
      setFileList([...fileList, file])
      return false // 返回false阻止自动上传
    },
    onRemove: (file) => {
      const index = fileList.indexOf(file)
      const newFileList = fileList.slice()
      newFileList.splice(index, 1)
      setFileList(newFileList)
    }
  }

  // 如果已经提交，显示成功页面
  if (isSubmitted) {
    return (
      <SettingContainer>
        <SettingGroup>
          <SettingTitle>{t('settings.about.feedback.title')}</SettingTitle>
          <SettingDivider />
          <Result
            status="success"
            icon={<CheckCircleFilled style={{ color: '#52c41a' }} />}
            title="反馈提交成功！"
            subTitle="感谢您的反馈，我们会尽快处理。"
            extra={[
              <Button type="primary" key="back" onClick={resetForm}>
                返回反馈表单
              </Button>
            ]}
          />
        </SettingGroup>
      </SettingContainer>
    )
  }

  // 未提交时显示表单
  return (
    <SettingContainer>
      <SettingGroup>
        <SettingTitle>{t('settings.about.feedback.title')}</SettingTitle>
        <SettingDivider />
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '反馈内容不能为空' }]}>
            <TextArea rows={7} showCount maxLength={1000} placeholder="请输入您的反馈内容" />
          </Form.Item>
          <Form.Item
            name="file"
            label={
              <span>
                上传附件{' '}
                <span style={{ color: 'gray', fontSize: 'smaller' }}>(只能上传图片文件，且大小不超过10MB)</span>
              </span>
            }>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select placeholder="请选择反馈类型">
              <Option value="suggestion">建议</Option>
              <Option value="question">问题</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="school" label="学校">
                <Input placeholder="请输入您的学校" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contactInfo" label="联系方式">
                <Input placeholder="姓+联系方式（邮箱或手机号）" />
              </Form.Item>
            </Col>
          </Row>

          <SettingDivider />
          <SettingRow>
            <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
              <Button type="primary" htmlType="submit" size="middle">
                提交
              </Button>
              <Button htmlType="reset" size="middle" onClick={() => form.resetFields()}>
                重置
              </Button>
            </Space>
          </SettingRow>
        </Form>
      </SettingGroup>
    </SettingContainer>
  )
}

export default FeedbackForm
