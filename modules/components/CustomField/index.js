import React, { memo, useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Form, Button, Badge } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import throat from 'throat'
import _ from 'lodash'
import { storage } from 'lib/leancloud'
import Select, { MultiSelect } from 'modules/components/Select'
import { RadioGroup, NativeRadio } from 'modules/components/Radio'
import { useAppContext } from 'modules/context'
import styles from './index.module.scss'

export const includeOptionsType = ['dropdown', 'multi-select', 'radios']
export const fieldType = [
  'text',
  'multi-line',
  // 'checkbox',
  'dropdown',
  'multi-select',
  'radios',
  'file',
]

const Text = memo(
  ({
    id = _.uniqueId('Text'),
    label,
    value,
    onChange,
    disabled,
    readOnly,
    required,
    className,
    size,
  }) => {
    return (
      <Form.Group className={className}>
        {label && <Form.Label htmlFor={id}>{label}</Form.Label>}
        <Form.Control
          id={id}
          size={size}
          disabled={disabled}
          readOnly={readOnly}
          value={value || ''}
          onChange={(e) => {
            if (onChange) {
              const v = e.target.value
              onChange(v)
            }
          }}
          required={required}
        />
      </Form.Group>
    )
  }
)

const MultiLine = memo(
  ({
    id = _.uniqueId('MultiLine'),
    label,
    value,
    onChange,
    disabled,
    readOnly,
    required,
    className,
    size,
  }) => {
    return (
      <Form.Group className={className}>
        {label && <Form.Label htmlFor={id}>{label}</Form.Label>}
        <Form.Control
          size={size}
          id={id}
          as="textarea"
          rows={3}
          disabled={disabled}
          readOnly={readOnly}
          value={value || ''}
          onChange={(e) => {
            if (onChange) {
              const v = e.target.value
              onChange(v)
            }
          }}
          required={required}
        />
      </Form.Group>
    )
  }
)

const Checkbox = memo(
  ({
    id = _.uniqueId('Checkbox'),
    label,
    disabled,
    required,
    onChange,
    value,
    readOnly,
    className,
  }) => {
    return (
      <Form.Group className={className}>
        <Form.Check type="checkbox">
          <Form.Check.Input
            id={id}
            disabled={disabled}
            checked={value || false}
            readOnly={readOnly}
            required={required}
            onChange={(e) => {
              if (onChange) {
                const { checked } = e.target
                onChange(checked)
              }
            }}
          />
          <Form.Check.Label htmlFor={id}>{label || ' '}</Form.Check.Label>
        </Form.Check>
      </Form.Group>
    )
  }
)
const defaultPlaceholder = ''
const getDisplayText = (options, value) => {
  if (!options) {
    return value
  }
  let result = value
  options.some((v) => {
    if (Array.isArray(v) && v[0] === value) {
      result = v[1]
      return true
    } else {
      if (v === value) {
        result = v
        return true
      }
    }
    return false
  })
  return result
}

const Dropdown = memo(
  ({
    id = _.uniqueId('Dropdown'),
    size,
    label,
    readOnly,
    disabled,
    options,
    className,
    ...rest
  }) => {
    const displayMode = readOnly || disabled
    return (
      <Form.Group className={className}>
        {label && <Form.Label htmlFor={id}>{label}</Form.Label>}
        {displayMode && (
          <Form.Control
            size={size}
            readOnly={readOnly}
            disabled={disabled}
            value={getDisplayText(options, rest.value)}
          />
        )}
        {!displayMode && (
          <Select
            id={id}
            size={size}
            placeholder={defaultPlaceholder}
            options={options}
            {...rest}
          />
        )}
      </Form.Group>
    )
  }
)

const MultiSelectField = memo(
  ({
    id = _.uniqueId('MultiSelect'),
    label,
    onChange,
    value,
    disabled,
    required,
    options,
    readOnly,
    className,
  }) => {
    const reOptions = useMemo(() => {
      if (!options) {
        return []
      }
      return options.map(([v, title]) => ({
        label: title,
        value: v,
        disabled: disabled || readOnly,
      }))
    }, [options, readOnly, disabled])
    return (
      <Form.Group className={className}>
        {label && <Form.Label htmlFor={id}>{label}</Form.Label>}
        <MultiSelect
          options={reOptions}
          required={required}
          name={id}
          values={value}
          onChange={onChange}
          className={styles.optionItem}
        />
      </Form.Group>
    )
  }
)

const Radios = memo(
  ({
    id = _.uniqueId('Checkbox'),
    label,
    disabled,
    required,
    readOnly,
    options,
    value,
    onChange,
    className,
  }) => {
    const radios = useMemo(() => {
      if (!options) {
        return []
      }
      return options.map(([v, title]) => ({
        label: title,
        disabled: disabled || readOnly,
        value: v,
      }))
    }, [options, disabled, readOnly])
    return (
      <Form.Group className={className}>
        {label && <Form.Label htmlFor={id}>{label}</Form.Label>}
        <RadioGroup
          as={NativeRadio}
          radios={radios}
          required={required}
          name={id}
          value={value}
          onChange={onChange}
          className={styles.optionItem}
        />
      </Form.Group>
    )
  }
)
const UPLOAD_CONCURRENCY = 3
const FileInput = memo(
  ({
    id = _.uniqueId('FileInput'),
    label,
    value,
    onChange,
    disabled,
    readOnly,
    required,
    className,
    size,
  }) => {
    const { t } = useTranslation()
    const { addNotification } = useAppContext()
    const banned = disabled || readOnly
    const [uploadProgress, setUploadProgress] = useState()
    const uploadFile = useCallback(
      async (fileList) => {
        const files = Array.from(fileList)
        if (!onChange || files.length === 0) {
          return
        }
        setUploadProgress(0)
        const fileDonePercent = new WeakMap()
        const totalSize = files.reduce((prev, current) => prev + current.size, 0)
        const updateProgress = (percent, file) => {
          fileDonePercent.set(file, percent)
          const totalDoneSize = files.reduce(
            (prev, current) => prev + (fileDonePercent.get(current) || 0) * current.size,
            0
          )
          const progress = Number((totalDoneSize / totalSize).toFixed(0))
          setUploadProgress(progress)
        }
        const uploadTasks = files.map((file) => () =>
          storage
            .upload(file.name, file, {
              onProgress: ({ percent }) => updateProgress(percent, file),
            })
            .catch(addNotification)
        )
        try {
          const fileIds = await Promise.all(
            uploadTasks.map(throat(UPLOAD_CONCURRENCY, (task) => task()))
          ).then((objects) => objects.map((obj) => obj.id))
          onChange(fileIds)
        } catch (error) {
          addNotification(error)
        }
        setUploadProgress(undefined)
      },
      [onChange, addNotification]
    )
    const isEmpty = Array.isArray(value) && value.length === 0
    return (
      <Form.Group className={className}>
        {label && <Form.Label htmlFor={id}>{label}</Form.Label>}
        <input
          hidden
          type="file"
          id={id}
          disabled={banned}
          required={required && isEmpty}
          multiple
          onChange={(e) => {
            if (e.target && e.target.files) {
              uploadFile(e.target.files)
            }
          }}
        />
        <div>
          <Button
            as={banned ? undefined : Form.Label}
            htmlFor={id}
            disabled={banned}
            size={size}
            variant="secondary"
          >
            {uploadProgress === undefined ? t('upload') : `${t('uploading')} (${uploadProgress}%)`}
          </Button>
        </div>
      </Form.Group>
    )
  }
)

function CustomField({ type, options, ...rest }) {
  switch (type) {
    case 'text':
      return <Text {...rest} />
    case 'multi-line':
      return <MultiLine {...rest} />
    // case 'checkbox':
    //   return <Checkbox {...rest} />
    case 'dropdown':
      return <Dropdown {...rest} options={options} />
    case 'multi-select':
      return <MultiSelectField {...rest} options={options} />
    case 'radios':
      return <Radios {...rest} options={options} />
    case 'file':
      return <FileInput {...rest} />
    default:
      return null
  }
}
CustomField.propTypes = {
  type: PropTypes.oneOf(fieldType),
  id: PropTypes.string,
  label: PropTypes.node,
  description: PropTypes.node,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  value: PropTypes.any,
  onChange: PropTypes.func,
  options: PropTypes.any,
  className: PropTypes.string,
  size: PropTypes.string,
}
export default CustomField

function CustomFieldDisplay({ type, value, label, className, options }) {
  const { t } = useTranslation()
  const NoneNode = (
    <Form.Group className={className}>
      <Form.Label>{label}</Form.Label>
      <p>{t('none')} </p>
    </Form.Group>
  )
  switch (type) {
    case 'file':
      if (value === undefined || !Array.isArray(value) || value.length === 0) {
        return NoneNode
      }
      return (
        <Form.Group className={className}>
          <Form.Label>{label}</Form.Label>
          <ul className={styles.fileList}>
            {value.map((id) => {
              return (
                <li key={id}>
                  <a href={`/api/1/files/${id}/redirection`} target="_blank">
                    {id}
                  </a>
                </li>
              )
            })}
          </ul>
        </Form.Group>
      )
    case 'text':
    case 'multi-line':
      if (value === undefined) {
        return NoneNode
      }
      return (
        <Form.Group className={className}>
          <Form.Label>{label}</Form.Label>
          <p>{value} </p>
        </Form.Group>
      )
    case 'checkbox':
      value = value === 'false' ? false : Boolean(value)
      return (
        <Form.Group className={className}>
          <Form.Label>{label}</Form.Label>
          <p>{value ? 'Yes' : 'No'}</p>
        </Form.Group>
      )
    case 'dropdown':
    case 'radios':
      return (
        <Form.Group className={className}>
          <Form.Label>{label}</Form.Label>
          <p>{getDisplayText(options, value) || t('none')} </p>
        </Form.Group>
      )
    case 'multi-select':
      if (!value || !Array.isArray(value)) {
        return NoneNode
      }
      const selectedOptions = (options || []).filter(([v]) => {
        return value.includes(v)
      })
      if (selectedOptions.length === 0) {
        return NoneNode
      }
      return (
        <Form.Group className={className}>
          <Form.Label>{label}</Form.Label>
          <p>
            {selectedOptions.map(([, text], index) => (
              <Badge pill className={styles.badge} variant="info" key={index}>
                {text}
              </Badge>
            ))}
          </p>
        </Form.Group>
      )
    default:
      return null
  }
}

CustomFieldDisplay.propTypes = {
  type: PropTypes.oneOf(fieldType),
  label: PropTypes.node,
  value: PropTypes.any,
  options: PropTypes.any,
  className: PropTypes.string,
}

export { CustomFieldDisplay }
