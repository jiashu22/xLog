"use client"

import confetti from "canvas-confetti"
import { useEffect, useMemo, useRef, useState } from "react"

import { CharacterList } from "~/components/common/CharacterList"
import { Modal } from "~/components/ui/Modal"
import { Tooltip } from "~/components/ui/Tooltip"
import { UniLink } from "~/components/ui/UniLink"
import { CSB_SCAN } from "~/lib/env"
import { Trans, useTranslation } from "~/lib/i18n/client"
import { cn } from "~/lib/utils"
import {
  useCheckLike,
  useGetLikeCounts,
  useGetLikes,
  useToggleLikePage,
} from "~/queries/page"

import { AvatarStack } from "../ui/AvatarStack"
import { Button } from "../ui/Button"

export const ReactionLike = ({
  size,
  characterId,
  noteId,
  vertical,
}: {
  size?: "sm" | "base"
  characterId?: number
  noteId?: number
  vertical?: boolean
}) => {
  const toggleLikePage = useToggleLikePage()
  const { t, i18n } = useTranslation("common")

  const [isLikeOpen, setIsLikeOpen] = useState(false)
  const [isLikeListOpen, setIsLikeListOpen] = useState(false)
  const likeRef = useRef<HTMLButtonElement>(null)

  const [likes, likesMutation] = useGetLikes({
    characterId,
    noteId,
  })
  const [likeStatus] = useCheckLike({
    characterId,
    noteId,
  })
  const likeCounts = useGetLikeCounts({
    characterId,
    noteId,
  })

  const [isUnlikeOpen, setIsUnlikeOpen] = useState(false)

  const like = () => {
    if (characterId && noteId) {
      if (likeStatus.isLiked) {
        setIsLikeOpen(true)
      } else {
        toggleLikePage.mutate({
          characterId,
          noteId,
          action: "link",
        })
      }
    }
  }

  const unlike = () => {
    if (characterId && noteId) {
      setIsUnlikeOpen(false)
      if (likeStatus.isLiked) {
        toggleLikePage.mutate({
          noteId,
          characterId,
          action: "unlink",
        })
      } // else do nothing
    }
  }

  useEffect(() => {
    if (toggleLikePage.isSuccess) {
      if (likeRef.current?.getBoundingClientRect() && likeStatus.isLiked) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: {
            x:
              (likeRef.current.getBoundingClientRect().left +
                likeRef.current.getBoundingClientRect().width / 2 || 0.5) /
              window.innerWidth,
            y:
              (likeRef.current.getBoundingClientRect().top || 0.5) /
              window.innerHeight,
          },
        })
      }
    }
  }, [toggleLikePage.isSuccess])

  const showAvatarStack = size !== "sm" && !vertical

  const avatars = useMemo(
    () =>
      likes
        ?.sort((a, b) =>
          b.character?.metadata?.content?.avatars?.[0] ? 1 : -1,
        )
        .slice(0, 3)
        .map(($) => ({
          images: $.character?.metadata?.content?.avatars,
          name: $.character?.metadata?.content?.name,
        })),
    [likes],
  )
  return (
    <>
      <div className={cn("xlog-reactions-like flex items-center sm:mb-0")}>
        <Button
          variant="like"
          variantColor={vertical ? "light" : undefined}
          className={cn(
            "flex items-center",
            {
              active: likeStatus.isLiked,
            },
            vertical ? "!h-auto flex-col" : "mr-2",
          )}
          isAutoWidth={true}
          onClick={like}
          isLoading={toggleLikePage.isPending}
          ref={likeRef}
        >
          {(() => {
            const inner = (
              <i
                className={cn(
                  "icon-[mingcute--thumb-up-2-fill]",
                  size === "sm"
                    ? "text-base"
                    : vertical
                    ? "text-[33px]"
                    : "text-[38px]",
                  !vertical && "mr-1",
                )}
              ></i>
            )
            return size !== "sm" ? (
              <Tooltip label={t("Like")} placement={vertical ? "right" : "top"}>
                {inner}
              </Tooltip>
            ) : (
              inner
            )
          })()}
          <span className="leading-snug">
            {!likeCounts.isLoading ? likeCounts.data : "-"}
          </span>
        </Button>
        {showAvatarStack && (
          <AvatarStack
            avatars={avatars}
            count={likeCounts.data || 0}
            onClick={() => setIsLikeListOpen(true)}
          />
        )}
      </div>
      <Modal
        open={isLikeOpen}
        setOpen={setIsLikeOpen}
        title={t("Like successfully") || ""}
      >
        <div className="p-5">
          <Trans i18nKey="like stored" i18n={i18n}>
            Your like has been stored on the blockchain, view it on{" "}
            <UniLink
              className="text-accent"
              href={`${CSB_SCAN}/tx/${likeStatus.transactionHash}`}
            >
              Crossbell Scan
            </UniLink>
          </Trans>
        </div>
        <div className="border-t flex flex-col md:flex-row gap-4 items-center px-5 py-4">
          <Button isBlock onClick={() => setIsLikeOpen(false)}>
            {t("Got it, thanks!")}
          </Button>
          <Button
            variant="secondary"
            isBlock
            onClick={() => {
              setIsUnlikeOpen(true)
              setIsLikeOpen(false)
            }}
          >
            {t("Revert")}
          </Button>
        </div>
      </Modal>
      <Modal
        open={isUnlikeOpen}
        setOpen={setIsUnlikeOpen}
        title={t("Confirm to revert")}
      >
        <div className="p-5">
          <Trans i18nKey="like revert" i18n={i18n}>
            Do you really want to revert this like action?
          </Trans>
        </div>
        <div className="border-t flex flex-col md:flex-row gap-4 items-center px-5 py-4">
          <Button isBlock onClick={() => setIsUnlikeOpen(false)}>
            {t("Cancel")}
          </Button>
          <Button variant="secondary" isBlock onClick={() => unlike()}>
            {t("Confirm")}
          </Button>
        </div>
      </Modal>
      {showAvatarStack && (
        <CharacterList
          open={isLikeListOpen}
          setOpen={setIsLikeListOpen}
          title={t("Like List")}
          loadMore={likesMutation.fetchNextPage}
          hasMore={!!likesMutation.hasNextPage}
          list={likesMutation.data?.pages || []}
        ></CharacterList>
      )}
    </>
  )
}
