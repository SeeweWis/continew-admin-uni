import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchUpdateProfileAvatar } from '../src/api/profile'
import { http } from '../src/http/http'

vi.mock('../src/http/http', () => ({ http: vi.fn() }))

function chooseFile(bytes: number[]) {
  const data = new Uint8Array(bytes).buffer
  vi.stubGlobal('wx', {
    getFileSystemManager: () => ({
      readFile: ({ success }: { success: (result: { data: ArrayBuffer }) => void }) => success({ data }),
    }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('weChat profile avatar upload', () => {
  it('sends the selected PNG to the existing PATCH multipart endpoint', async () => {
    const image = [0x89, 0x50, 0x4E, 0x47, 1, 2, 3]
    chooseFile(image)
    vi.mocked(http).mockResolvedValue({ avatar: 'https://example.com/avatar.png' })

    await expect(fetchUpdateProfileAvatar('wxfile://avatar')).resolves.toEqual({ avatar: 'https://example.com/avatar.png' })
    const request = vi.mocked(http).mock.calls[0][0]
    expect(request.url).toBe('/user/profile/avatar')
    expect(request.method).toBe('PATCH')
    expect(request.header?.['Content-Type']).toMatch(/^multipart\/form-data; boundary=----uni-avatar-/)
    const body = new Uint8Array(request.data as ArrayBuffer)
    const content = new TextDecoder().decode(body)
    expect(content).toContain('name="avatarFile"; filename="avatar.png"\r\nContent-Type: image/png\r\n\r\n')
    const fileStart = content.indexOf('\r\n\r\n') + 4
    expect([...body.slice(fileStart, fileStart + image.length)]).toEqual(image)
    expect(content).toContain(`\r\n--${String(request.header?.['Content-Type']).split('boundary=')[1]}--\r\n`)
  })

  it('rejects unsupported files before making a request', async () => {
    chooseFile([1, 2, 3])
    await expect(fetchUpdateProfileAvatar('wxfile://other')).rejects.toThrow('头像仅支持')
    expect(http).not.toHaveBeenCalled()
  })
})
