import React, {useCallback} from 'react'
import {Keyboard, Pressable, View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {ChatBskyConvoDefs} from '@atproto-labs/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {useMarkAsReadMutation} from '#/state/queries/messages/conversation'
import {useLeaveConvo} from '#/state/queries/messages/leave-conversation'
import {
  useMuteConvo,
  useUnmuteConvo,
} from '#/state/queries/messages/mute-conversation'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {ArrowBoxLeft_Stroke2_Corner0_Rounded as ArrowBoxLeft} from '#/components/icons/ArrowBoxLeft'
import {DotGrid_Stroke2_Corner0_Rounded as DotsHorizontal} from '#/components/icons/DotGrid'
import {Flag_Stroke2_Corner0_Rounded as Flag} from '#/components/icons/Flag'
import {Mute_Stroke2_Corner0_Rounded as Mute} from '#/components/icons/Mute'
import {Person_Stroke2_Corner0_Rounded as Person} from '#/components/icons/Person'
import {PersonCheck_Stroke2_Corner0_Rounded as PersonCheck} from '#/components/icons/PersonCheck'
import {PersonX_Stroke2_Corner0_Rounded as PersonX} from '#/components/icons/PersonX'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as Unmute} from '#/components/icons/Speaker'
import * as Menu from '#/components/Menu'
import * as Prompt from '#/components/Prompt'
import {Bubble_Stroke2_Corner2_Rounded as Bubble} from '../icons/Bubble'

let ConvoMenu = ({
  convo,
  profile,
  onUpdateConvo,
  control,
  currentScreen,
  showMarkAsRead,
  hideTrigger,
  triggerOpacity,
}: {
  convo: ChatBskyConvoDefs.ConvoView
  profile: AppBskyActorDefs.ProfileViewBasic
  onUpdateConvo?: (convo: ChatBskyConvoDefs.ConvoView) => void
  control?: Menu.MenuControlProps
  currentScreen: 'list' | 'conversation'
  showMarkAsRead?: boolean
  hideTrigger?: boolean
  triggerOpacity?: number
}): React.ReactNode => {
  const navigation = useNavigation<NavigationProp>()
  const {_} = useLingui()
  const t = useTheme()
  const leaveConvoControl = Prompt.usePromptControl()
  const {mutate: markAsRead} = useMarkAsReadMutation()

  const onNavigateToProfile = useCallback(() => {
    navigation.navigate('Profile', {name: profile.did})
  }, [navigation, profile.did])

  const {mutate: muteConvo} = useMuteConvo(convo.id, {
    onSuccess: data => {
      onUpdateConvo?.(data.convo)
      Toast.show(_(msg`Chat muted`))
    },
    onError: () => {
      Toast.show(_(msg`Could not mute chat`))
    },
  })

  const {mutate: unmuteConvo} = useUnmuteConvo(convo.id, {
    onSuccess: data => {
      onUpdateConvo?.(data.convo)
      Toast.show(_(msg`Chat unmuted`))
    },
    onError: () => {
      Toast.show(_(msg`Could not unmute chat`))
    },
  })

  const {mutate: leaveConvo} = useLeaveConvo(convo.id, {
    onSuccess: () => {
      if (currentScreen === 'conversation') {
        navigation.replace('Messages')
      }
    },
    onError: () => {
      Toast.show(_(msg`Could not leave chat`))
    },
  })

  return (
    <>
      <Menu.Root control={control}>
        {!hideTrigger && (
          <View style={{opacity: triggerOpacity}}>
            <Menu.Trigger label={_(msg`Chat settings`)}>
              {({props, state}) => (
                <Pressable
                  {...props}
                  onPress={() => {
                    Keyboard.dismiss()
                    // eslint-disable-next-line react/prop-types -- eslint is confused by the name `props`
                    props.onPress()
                  }}
                  style={[
                    a.p_sm,
                    a.rounded_full,
                    (state.hovered || state.pressed) && t.atoms.bg_contrast_25,
                    // make sure pfp is in the middle
                    {marginLeft: -10},
                  ]}>
                  <DotsHorizontal size="md" style={t.atoms.text} />
                </Pressable>
              )}
            </Menu.Trigger>
          </View>
        )}
        <Menu.Outer>
          <Menu.Group>
            {showMarkAsRead && (
              <Menu.Item
                label={_(msg`Mark as read`)}
                onPress={() =>
                  markAsRead({
                    convoId: convo.id,
                  })
                }>
                <Menu.ItemText>
                  <Trans>Mark as read</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={Bubble} />
              </Menu.Item>
            )}
            <Menu.Item
              label={_(msg`Go to user's profile`)}
              onPress={onNavigateToProfile}>
              <Menu.ItemText>
                <Trans>Go to profile</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={Person} />
            </Menu.Item>
            <Menu.Item
              label={_(msg`Mute notifications`)}
              onPress={() => (convo?.muted ? unmuteConvo() : muteConvo())}>
              <Menu.ItemText>
                {convo?.muted ? (
                  <Trans>Unmute notifications</Trans>
                ) : (
                  <Trans>Mute notifications</Trans>
                )}
              </Menu.ItemText>
              <Menu.ItemIcon icon={convo?.muted ? Unmute : Mute} />
            </Menu.Item>
          </Menu.Group>
          <Menu.Divider />
          {/* TODO(samuel): implement these */}
          <Menu.Group>
            <Menu.Item
              label={_(msg`Block account`)}
              onPress={() => {}}
              disabled>
              <Menu.ItemText>
                <Trans>Block account</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon
                icon={profile.viewer?.blocking ? PersonCheck : PersonX}
              />
            </Menu.Item>
            <Menu.Item
              label={_(msg`Report account`)}
              onPress={() => {}}
              disabled>
              <Menu.ItemText>
                <Trans>Report account</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={Flag} />
            </Menu.Item>
          </Menu.Group>
          <Menu.Divider />
          <Menu.Group>
            <Menu.Item
              label={_(msg`Leave conversation`)}
              onPress={leaveConvoControl.open}>
              <Menu.ItemText>
                <Trans>Leave conversation</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={ArrowBoxLeft} />
            </Menu.Item>
          </Menu.Group>
        </Menu.Outer>
      </Menu.Root>

      <Prompt.Basic
        control={leaveConvoControl}
        title={_(msg`Leave conversation`)}
        description={_(
          msg`Are you sure you want to leave this conversation? Your messages will be deleted for you, but not for other participants.`,
        )}
        confirmButtonCta={_(msg`Leave`)}
        confirmButtonColor="negative"
        onConfirm={() => leaveConvo()}
      />
    </>
  )
}
ConvoMenu = React.memo(ConvoMenu)

export {ConvoMenu}
