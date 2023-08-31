import { Collection } from 'discord.js'

export interface UserAction {
  type: 'button' | 'command' | 'modal'
  name: string
  memberId: string
  timestamp: Date
}

export default class UserActionsManager {
  public userActions: Collection<string, UserAction[]> = new Collection()

  public addAction(guildId: string, action: Omit<UserAction, 'timestamp'>) {
    const actions = this.userActions.ensure(guildId, () => [])

    if (action.name === 'actions') return

    const newAction: UserAction = {
      ...action,
      timestamp: new Date()
    }

    actions.unshift(newAction)
    if (actions.length > 10) actions.length = 10
  }

  public getActions(guildId: string): UserAction[] {
    return this.userActions.ensure(guildId, () => [])
  }
}
